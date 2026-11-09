import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import '../models/note.dart';
import '../providers/providers.dart';
import '../widgets/pin_dialog.dart';

/// `noteId == null` means "create a new note on first edit", matching the
/// web app's /notes/new flow.
class NoteEditorScreen extends ConsumerStatefulWidget {
  final String? noteId;
  const NoteEditorScreen({super.key, required this.noteId});

  @override
  ConsumerState<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends ConsumerState<NoteEditorScreen> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  String? _noteId;
  Note? _note;
  List<Attachment> _attachments = [];
  bool _loading = true;
  bool _locked = false;
  bool _saving = false;
  Timer? _saveDebounce;

  @override
  void initState() {
    super.initState();
    _noteId = widget.noteId;
    _load();
  }

  Future<void> _load() async {
    if (_noteId == null) {
      setState(() => _loading = false);
      return;
    }
    final notes = ref.read(notesServiceProvider);
    final note = await notes.get(_noteId!);
    setState(() {
      _note = note;
      _attachments = note.attachments;
      _loading = false;
      _locked = note.isProtected;
    });
    if (note.isProtected) {
      await _tryUnlock();
    } else {
      _fillFields(note);
    }
  }

  void _fillFields(Note note) {
    _title.text = note.title;
    _body.text = _stripHtml(note.content ?? '');
    setState(() => _locked = false);
  }

  Future<void> _tryUnlock() async {
    final lock = ref.read(lockServiceProvider);
    final viaBiometrics = await lock.unlock(_noteId!);
    if (viaBiometrics) {
      _fillFields(_note!);
      return;
    }
    if (!mounted) return;
    final pin = await showPinDialog(context, title: 'Enter PIN', message: 'This note is protected.');
    if (pin == null) {
      if (mounted) Navigator.of(context).pop();
      return;
    }
    final ok = await lock.unlockWithPin(_noteId!, pin);
    if (!mounted) return;
    if (ok) {
      _fillFields(_note!);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incorrect PIN')));
      Navigator.of(context).pop();
    }
  }

  String _stripHtml(String html) => html.replaceAll(RegExp(r'<[^>]*>'), '').trim();

  Future<String> _ensureCreated() async {
    if (_noteId != null) return _noteId!;
    final note = await ref.read(notesServiceProvider).create(title: _title.text, content: '<p>${_body.text}</p>');
    setState(() {
      _noteId = note.id;
      _note = note;
    });
    return note.id;
  }

  void _scheduleSave() {
    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(milliseconds: 600), _save);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final id = await _ensureCreated();
    await ref.read(notesServiceProvider).update(id, {
      'title': _title.text,
      'content': '<p>${_body.text}</p>',
      'plainText': _body.text,
    });
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _addImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    final id = await _ensureCreated();
    final attachment = await ref.read(notesServiceProvider).uploadImage(id, File(picked.path));
    setState(() => _attachments = [..._attachments, attachment]);
  }

  Future<void> _toggleLock() async {
    final id = await _ensureCreated();
    final notes = ref.read(notesServiceProvider);
    if (_note?.isProtected ?? false) {
      await notes.removeLock(id);
      setState(() => _note = _note!.copyWithProtected(false));
      return;
    }
    if (!mounted) return;
    final pin = await showPinDialog(context, title: 'Set a PIN', message: 'Required to reopen this note (also usable with fingerprint).');
    if (pin == null || pin.length < 4) return;
    await notes.setLock(id, pin);
    setState(() => _note = _note?.copyWithProtected(true));
  }

  void _shareViaDevice() {
    final text = '${_title.text}\n\n${_body.text}';
    Share.share(text, subject: _title.text.isEmpty ? 'Untitled note' : _title.text);
  }

  @override
  void dispose() {
    _saveDebounce?.cancel();
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    if (_note?.isProtected == true && _locked) {
      return const Scaffold(body: Center(child: Icon(Icons.lock_outline, size: 40)));
    }

    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(icon: const Icon(Icons.image_outlined), tooltip: 'Add image', onPressed: _addImage),
          IconButton(icon: const Icon(Icons.share_outlined), tooltip: 'Share via…', onPressed: _shareViaDevice),
          IconButton(
            icon: Icon((_note?.isProtected ?? false) ? Icons.lock_open_outlined : Icons.lock_outline),
            tooltip: (_note?.isProtected ?? false) ? 'Remove lock' : 'Lock note',
            onPressed: _toggleLock,
          ),
          if (_saving) const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _title,
            onChanged: (_) => _scheduleSave(),
            style: Theme.of(context).textTheme.headlineSmall,
            decoration: const InputDecoration(border: InputBorder.none, hintText: 'Untitled'),
          ),
          TextField(
            controller: _body,
            onChanged: (_) => _scheduleSave(),
            maxLines: null,
            minLines: 10,
            decoration: const InputDecoration(border: InputBorder.none, hintText: 'Start writing…'),
          ),
          if (_attachments.isNotEmpty) ...[
            const Divider(height: 32),
            Text('Attachments', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final a in _attachments)
                  if (a.kind == 'image')
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(a.url, width: 80, height: 80, fit: BoxFit.cover),
                    )
                  else
                    Chip(label: Text(a.fileName)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
