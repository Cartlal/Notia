import 'package:flutter/material.dart';
import '../models/note.dart';
import '../services/notes_service.dart';
import '../theme/app_theme.dart';

const _maxCollaborators = 5;

/// Mirrors web/src/components/ShareModal.tsx's collaborator section: add up
/// to 5 people by email, each view-only or edit, owner-only to manage.
class CollaboratorsDialog extends StatefulWidget {
  final String noteId;
  const CollaboratorsDialog({super.key, required this.noteId});

  @override
  State<CollaboratorsDialog> createState() => _CollaboratorsDialogState();
}

class _CollaboratorsDialogState extends State<CollaboratorsDialog> {
  final _notes = NotesService();
  final _email = TextEditingController();
  String _role = 'VIEWER';
  List<Collaborator> _collaborators = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _notes.listCollaborators(widget.noteId);
    if (mounted) setState(() { _collaborators = list; _loading = false; });
  }

  Future<void> _add() async {
    setState(() => _error = null);
    try {
      await _notes.addCollaborator(widget.noteId, _email.text.trim(), _role);
      _email.clear();
      await _load();
    } catch (e) {
      setState(() => _error = "Couldn't add that person");
    }
  }

  Future<void> _changeRole(String id, String role) async {
    await _notes.updateCollaborator(widget.noteId, id, role);
    await _load();
  }

  Future<void> _remove(String id) async {
    await _notes.removeCollaborator(widget.noteId, id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final atLimit = _collaborators.length >= _maxCollaborators;

    return AlertDialog(
      title: const Text('Collaborators'),
      content: SizedBox(
        width: 380,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Up to $_maxCollaborators people, each with view-only or edit access.', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _email,
                    enabled: !atLimit,
                    decoration: InputDecoration(hintText: atLimit ? 'Limit of $_maxCollaborators reached' : 'Email address', isDense: true),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _role,
                  items: const [
                    DropdownMenuItem(value: 'VIEWER', child: Text('Can view')),
                    DropdownMenuItem(value: 'EDITOR', child: Text('Can edit')),
                  ],
                  onChanged: atLimit ? null : (v) => setState(() => _role = v!),
                ),
                IconButton(
                  icon: const Icon(Icons.person_add_alt_1_outlined),
                  onPressed: atLimit ? null : _add,
                ),
              ],
            ),
            if (_error != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
            const SizedBox(height: 12),
            if (_loading)
              const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
            else if (_collaborators.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text('Not shared with anyone yet.', style: TextStyle(color: AppColors.textMuted)),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 260),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _collaborators.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, i) {
                    final c = _collaborators[i];
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.user.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                Text(c.user.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              ],
                            ),
                          ),
                          IconButton(
                            iconSize: 18,
                            visualDensity: VisualDensity.compact,
                            icon: Icon(Icons.visibility_outlined, color: c.role == 'VIEWER' ? AppColors.brand700 : AppColors.textMuted),
                            onPressed: () => _changeRole(c.id, 'VIEWER'),
                          ),
                          IconButton(
                            iconSize: 18,
                            visualDensity: VisualDensity.compact,
                            icon: Icon(Icons.edit_outlined, color: c.role == 'EDITOR' ? AppColors.brand700 : AppColors.textMuted),
                            onPressed: () => _changeRole(c.id, 'EDITOR'),
                          ),
                          IconButton(
                            iconSize: 18,
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () => _remove(c.id),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Done'))],
    );
  }
}
