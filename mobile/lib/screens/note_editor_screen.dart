import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import '../models/note.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import '../widgets/collaborators_dialog.dart';
import '../widgets/pin_dialog.dart';
import '../widgets/quill_note_editor.dart';

const _kNoteColors = <Color?>[null, Color(0xFFFEF3C7), Color(0xFFDBEAFE), Color(0xFFDCFCE7), Color(0xFFFCE7F3), Color(0xFFEDE9FE)];

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
  quill.QuillController _controller = quill.QuillController.basic();
  String? _noteId;
  Note? _note;
  List<Attachment> _attachments = [];
  Color? _color;
  PaperStyle _paperStyle = PaperStyle.none;
  bool _loading = true;
  bool _locked = false;
  bool _saving = false;
  Timer? _saveDebounce;

  @override
  void initState() {
    super.initState();
    _noteId = widget.noteId;
    _controller.addListener(_scheduleSave);
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
      _color = note.color != null ? _parseColor(note.color!) : null;
    });
    if (note.isProtected) {
      await _tryUnlock();
    } else {
      _fillFields(note);
    }
  }

  void _fillFields(Note note) {
    _title.text = note.title;
    _controller.removeListener(_scheduleSave);
    _controller.dispose();
    _controller = quill.QuillController(
      document: documentFromNote(contentJson: note.contentJson, htmlContent: note.content),
      selection: const TextSelection.collapsed(offset: 0),
    );
    _controller.addListener(_scheduleSave);
    setState(() => _locked = false);
  }

  Color? _parseColor(String hex) {
    final clean = hex.replaceFirst('#', '');
    return Color(int.parse('FF$clean', radix: 16));
  }

  String _colorToHex(Color c) =>
      '#${c.toARGB32().toRadixString(16).substring(2).toUpperCase()}';

  Future<void> _tryUnlock() async {
    final lock = ref.read(lockServiceProvider);
    final notes = ref.read(notesServiceProvider);

    // Central lock: a PIN already verified elsewhere this session (or on
    // an earlier app run) unlocks this note too via one fingerprint touch
    // — no per-note re-entry.
    final cachedPin = await lock.tryBiometricUnlock();
    if (cachedPin != null && await notes.verifyLock(_noteId!, cachedPin)) {
      _fillFields(_note!);
      return;
    }

    if (!mounted) return;
    final pin = await showPinDialog(context, title: 'Enter security PIN', message: 'This note is in your Secure section.');
    if (pin == null) {
      if (mounted) Navigator.of(context).pop();
      return;
    }
    final ok = await lock.verifyAndStorePin(pin) && await notes.verifyLock(_noteId!, pin);
    if (!mounted) return;
    if (ok) {
      _fillFields(_note!);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incorrect PIN')));
      Navigator.of(context).pop();
    }
  }

  Future<String> _ensureCreated() async {
    if (_noteId != null) return _noteId!;
    final note = await ref.read(notesServiceProvider).create(title: _title.text, content: '<p></p>');
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

  // There's no shared rich-text format between this Quill-based editor and
  // the web app's TipTap/HTML editor, so saving writes both: the Delta as
  // JSON (`contentJson`, read back losslessly by this app) and a plain
  // paragraph-wrapped HTML approximation (`content`, read by the web app) —
  // see documentFromNote's doc comment for the load-side half of this.
  Future<void> _save() async {
    setState(() => _saving = true);
    final id = await _ensureCreated();
    final plainText = _controller.document.toPlainText();
    final deltaJson = jsonEncode(_controller.document.toDelta().toJson());
    final html = plainText
        .split('\n')
        .where((l) => l.trim().isNotEmpty)
        .map((l) => '<p>${_escapeHtml(l)}</p>')
        .join();
    await ref.read(notesServiceProvider).update(id, {
      'title': _title.text,
      'content': html,
      'contentJson': deltaJson,
      'plainText': plainText,
    });
    if (mounted) setState(() => _saving = false);
  }

  String _escapeHtml(String s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

  Future<void> _setColor(Color? color) async {
    setState(() => _color = color);
    final id = await _ensureCreated();
    await ref.read(notesServiceProvider).update(id, {'color': color == null ? null : _colorToHex(color)});
  }

  Future<void> _addImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    final id = await _ensureCreated();
    final attachment = await ref.read(notesServiceProvider).uploadImage(id, File(picked.path));
    setState(() => _attachments = [..._attachments, attachment]);
  }

  // Locking a note just adds it to the Secure section — no PIN to type
  // here, since one security PIN already covers every note in it. The
  // one exception is the very first time: nothing to lock with yet.
  Future<void> _toggleLock() async {
    final id = await _ensureCreated();
    final notes = ref.read(notesServiceProvider);
    if (_note?.isProtected ?? false) {
      await notes.removeLock(id);
      setState(() => _note = _note!.copyWithProtected(false));
      return;
    }
    final user = ref.read(authControllerProvider).valueOrNull;
    if (user?.hasSecurityPin != true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Set a security PIN first, in Profile & settings')),
      );
      return;
    }
    await notes.setLock(id);
    setState(() => _note = _note?.copyWithProtected(true));
  }

  Future<void> _openCollaborators() async {
    final id = await _ensureCreated();
    if (!mounted) return;
    showDialog(context: context, builder: (_) => CollaboratorsDialog(noteId: id));
  }

  void _shareViaDevice() {
    final text = '${_title.text}\n\n${_controller.document.toPlainText()}';
    Share.share(text, subject: _title.text.isEmpty ? 'Untitled note' : _title.text);
  }

  @override
  void dispose() {
    _saveDebounce?.cancel();
    _title.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    if (_note?.isProtected == true && _locked) {
      return const Scaffold(body: Center(child: Icon(Icons.lock_outline, size: 40)));
    }

    return Scaffold(
      backgroundColor: _color,
      appBar: AppBar(
        backgroundColor: _color,
        actions: [
          PopupMenuButton<Color?>(
            tooltip: 'Note color',
            icon: const Icon(Icons.palette_outlined),
            itemBuilder: (context) => [
              for (final c in _kNoteColors)
                PopupMenuItem(
                  value: c,
                  child: Row(children: [
                    Container(width: 18, height: 18, decoration: BoxDecoration(color: c ?? Colors.white, shape: BoxShape.circle, border: Border.all(color: AppColors.border))),
                    const SizedBox(width: 8),
                    Text(c == null ? 'None' : ' '),
                  ]),
                ),
            ],
            onSelected: _setColor,
          ),
          IconButton(icon: const Icon(Icons.image_outlined), tooltip: 'Add image', onPressed: _addImage),
          IconButton(icon: const Icon(Icons.share_outlined), tooltip: 'Share via…', onPressed: _shareViaDevice),
          IconButton(icon: const Icon(Icons.people_outline), tooltip: 'Collaborators', onPressed: _openCollaborators),
          IconButton(
            icon: Icon((_note?.isProtected ?? false) ? Icons.lock_open_outlined : Icons.lock_outline),
            tooltip: (_note?.isProtected ?? false) ? 'Remove lock' : 'Lock note',
            onPressed: _toggleLock,
          ),
          if (_saving) const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _title,
              onChanged: (_) => _scheduleSave(),
              style: Theme.of(context).textTheme.headlineSmall,
              decoration: const InputDecoration(border: InputBorder.none, hintText: 'Untitled'),
            ),
            Expanded(
              child: QuillNoteEditor(
                controller: _controller,
                paperStyle: _paperStyle,
                onPaperStyleChanged: (s) => setState(() => _paperStyle = s),
              ),
            ),
            if (_attachments.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final a in _attachments)
                      if (a.kind == 'image')
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(a.url, width: 60, height: 60, fit: BoxFit.cover),
                        )
                      else
                        Chip(label: Text(a.fileName)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
