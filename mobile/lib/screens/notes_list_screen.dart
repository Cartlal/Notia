import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/note.dart';
import '../providers/providers.dart';
import '../providers/notes_providers.dart';
import '../theme/app_theme.dart';
import 'note_editor_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

class NotesListScreen extends ConsumerStatefulWidget {
  const NotesListScreen({super.key});

  @override
  ConsumerState<NotesListScreen> createState() => _NotesListScreenState();
}

const _views = [
  ('all', 'All notes', Icons.home_outlined),
  ('favorites', 'Favorites', Icons.star_border),
  ('pinned', 'Pinned', Icons.push_pin_outlined),
  ('shared', 'Shared with me', Icons.people_outline),
  ('locked', 'Secure', Icons.shield_outlined),
  ('archived', 'Archive', Icons.archive_outlined),
  ('trash', 'Trash', Icons.delete_outline),
];

class _NotesListScreenState extends ConsumerState<NotesListScreen> {
  String _view = 'all';
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final notesAsync = ref.watch(notesListProvider(_view));
    final isWide = MediaQuery.of(context).size.width >= 760;

    Future<void> logout() async {
      await ref.read(authControllerProvider.notifier).logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
    }

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search, size: 20),
              hintText: 'Search notes…',
              isDense: true,
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        Expanded(
          child: notesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Could not load notes: $e')),
            data: (notes) {
              final filtered = _query.isEmpty
                  ? notes
                  : notes.where((n) => n.title.toLowerCase().contains(_query.toLowerCase())).toList();
              if (filtered.isEmpty) {
                return const Center(child: Text('No notes here yet.'));
              }
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 260,
                  mainAxisExtent: 150,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: filtered.length,
                itemBuilder: (context, i) => _NoteCard(
                  note: filtered[i],
                  onChanged: () => ref.invalidate(notesListProvider(_view)),
                ),
              );
            },
          ),
        ),
      ],
    );

    Future<void> createNote() async {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NoteEditorScreen(noteId: null)));
      ref.invalidate(notesListProvider(_view));
    }

    Widget buildSidebar({required bool closeDrawerOnSelect}) {
      return Container(
        color: Theme.of(context).canvasColor,
        child: _Sidebar(
          selected: _view,
          onSelect: (v) {
            setState(() => _view = v);
            if (closeDrawerOnSelect) Navigator.of(context).pop();
          },
          onLogout: logout,
          onNewNote: createNote,
        ),
      );
    }

    return Scaffold(
      appBar: isWide
          ? null
          : AppBar(
              title: const Text('Notia'),
              actions: [IconButton(icon: const Icon(Icons.logout), onPressed: logout)],
            ),
      drawer: isWide ? null : Drawer(child: buildSidebar(closeDrawerOnSelect: true)),
      // On a wide (desktop/tablet) layout the sidebar already has its own
      // "New note" button, matching the web app; the FAB is mobile-only.
      floatingActionButton: isWide
          ? null
          : FloatingActionButton.extended(
              onPressed: createNote,
              icon: const Icon(Icons.add),
              label: const Text('New note'),
            ),
      body: isWide
          ? Row(
              children: [
                SizedBox(width: 260, child: buildSidebar(closeDrawerOnSelect: false)),
                VerticalDivider(width: 1, color: AppColors.border),
                Expanded(child: content),
              ],
            )
          : content,
    );
  }
}

class _Sidebar extends ConsumerWidget {
  final String selected;
  final ValueChanged<String> onSelect;
  final VoidCallback onLogout;
  final VoidCallback onNewNote;

  const _Sidebar({required this.selected, required this.onSelect, required this.onLogout, required this.onNewNote});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: _LogoBadge(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: ElevatedButton.icon(
              onPressed: onNewNote,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New note'),
            ),
          ),
          const SizedBox(height: 8),
          for (final (key, label, icon) in _views)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              child: ListTile(
                dense: true,
                leading: Icon(icon, size: 20),
                title: Text(label, style: const TextStyle(fontSize: 14)),
                selected: selected == key,
                onTap: () => onSelect(key),
              ),
            ),
          const Spacer(),
          Divider(color: AppColors.border, height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            child: ListTile(
              dense: true,
              leading: Icon(themeMode == ThemeMode.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 20),
              title: const Text('Toggle theme', style: TextStyle(fontSize: 14)),
              onTap: () => ref.read(themeModeProvider.notifier).state =
                  themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            child: ListTile(
              dense: true,
              leading: const Icon(Icons.settings_outlined, size: 20),
              title: Text(
                ref.watch(authControllerProvider).valueOrNull?.name ?? '',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                overflow: TextOverflow.ellipsis,
              ),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: ListTile(
              dense: true,
              leading: const Icon(Icons.logout, size: 20, color: Color(0xFFDC2626)),
              title: const Text('Log out', style: TextStyle(fontSize: 14, color: Color(0xFFDC2626))),
              onTap: onLogout,
            ),
          ),
        ],
      ),
    );
  }
}

/// Matches web/src/components/Logo.tsx, which renders the same asset.
class _LogoBadge extends StatelessWidget {
  const _LogoBadge();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.asset('assets/logo.png', width: 28, height: 28, fit: BoxFit.cover),
        ),
        const SizedBox(width: 8),
        const Text('Notia', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
      ],
    );
  }
}

class _NoteCard extends ConsumerWidget {
  final Note note;
  final VoidCallback onChanged;
  const _NoteCard({required this.note, required this.onChanged});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.read(notesServiceProvider);

    Future<void> act(Future<void> Function() fn) async {
      await fn();
      onChanged();
    }

    void showActions() {
      showModalBottomSheet(
        context: context,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: note.isTrashed
                ? [
                    _ActionTile(icon: Icons.restore, label: 'Restore', onTap: () { Navigator.pop(context); act(() => notes.restore(note.id)); }),
                    _ActionTile(icon: Icons.delete_forever, label: 'Delete permanently', danger: true, onTap: () { Navigator.pop(context); act(() => notes.delete(note.id)); }),
                  ]
                : [
                    _ActionTile(icon: Icons.push_pin_outlined, label: note.isPinned ? 'Unpin' : 'Pin', onTap: () { Navigator.pop(context); act(() => notes.togglePin(note.id)); }),
                    _ActionTile(icon: Icons.star_border, label: note.isFavorite ? 'Unfavorite' : 'Favorite', onTap: () { Navigator.pop(context); act(() => notes.toggleFavorite(note.id)); }),
                    _ActionTile(icon: Icons.copy_outlined, label: 'Duplicate', onTap: () { Navigator.pop(context); act(() => notes.duplicate(note.id)); }),
                    _ActionTile(icon: Icons.archive_outlined, label: note.isArchived ? 'Unarchive' : 'Archive', onTap: () { Navigator.pop(context); act(() => notes.toggleArchive(note.id)); }),
                    _ActionTile(icon: Icons.delete_outline, label: 'Move to trash', danger: true, onTap: () { Navigator.pop(context); act(() => notes.trash(note.id)); }),
                  ],
          ),
        ),
      );
    }

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: note.id))),
        onLongPress: showActions,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600))),
                if (note.isProtected) const Icon(Icons.lock_outline, size: 14),
                IconButton(
                  icon: const Icon(Icons.more_vert, size: 18),
                  visualDensity: VisualDensity.compact,
                  onPressed: showActions,
                ),
              ]),
              Expanded(
                child: Text(
                  note.isProtected ? 'Protected note' : _plainText(note.content),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _plainText(String? html) {
    if (html == null) return '';
    return html.replaceAll(RegExp(r'<[^>]*>'), ' ').trim();
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  const _ActionTile({required this.icon, required this.label, required this.onTap, this.danger = false});

  @override
  Widget build(BuildContext context) {
    final color = danger ? Colors.red : null;
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: TextStyle(color: color)),
      onTap: onTap,
    );
  }
}
