import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/note.dart';
import 'providers.dart';

final notesListProvider = FutureProvider.autoDispose.family<List<Note>, String>((ref, view) {
  return ref.read(notesServiceProvider).list(view: view == 'all' ? '' : view);
});

final noteProvider = FutureProvider.autoDispose.family<Note, String>((ref, noteId) {
  return ref.read(notesServiceProvider).get(noteId);
});
