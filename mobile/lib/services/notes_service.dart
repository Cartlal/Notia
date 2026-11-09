import 'dart:io';
import 'package:dio/dio.dart';
import '../models/note.dart';
import 'api_client.dart';

class NotesService {
  final _dio = ApiClient.instance.dio;

  Future<List<Note>> list({String view = '', String? folderId}) async {
    final resp = await _dio.get('/notes', queryParameters: {
      if (view.isNotEmpty) 'view': view,
      if (folderId != null) 'folderId': folderId,
    });
    return (resp.data['notes'] as List).map((n) => Note.fromJson(n)).toList();
  }

  Future<Note> get(String id) async {
    final resp = await _dio.get('/notes/$id');
    return Note.fromJson(resp.data['note']);
  }

  Future<Note> create({String title = 'Untitled', String content = ''}) async {
    final resp = await _dio.post('/notes', data: {'title': title, 'content': content});
    return Note.fromJson(resp.data['note']);
  }

  Future<Note> update(String id, Map<String, dynamic> patch) async {
    final resp = await _dio.patch('/notes/$id', data: patch);
    return Note.fromJson(resp.data['note']);
  }

  Future<void> delete(String id) => _dio.delete('/notes/$id');
  Future<Note> togglePin(String id) async => Note.fromJson((await _dio.post('/notes/$id/pin')).data['note']);
  Future<Note> toggleFavorite(String id) async => Note.fromJson((await _dio.post('/notes/$id/favorite')).data['note']);
  Future<Note> toggleArchive(String id) async => Note.fromJson((await _dio.post('/notes/$id/archive')).data['note']);
  Future<Note> trash(String id) async => Note.fromJson((await _dio.post('/notes/$id/trash')).data['note']);
  Future<Note> restore(String id) async => Note.fromJson((await _dio.post('/notes/$id/restore')).data['note']);

  // Locking just adds the note to the central Secure section, gated by
  // the user's account password (see AuthService.verifyPassword) rather
  // than a separate PIN — nothing to collect here.
  Future<void> setLock(String id) => _dio.post('/notes/$id/lock');
  Future<void> removeLock(String id) => _dio.delete('/notes/$id/lock');
  Future<bool> verifyLock(String id, String password) async {
    try {
      await _dio.post('/notes/$id/unlock', data: {'password': password});
      return true;
    } on DioException {
      return false;
    }
  }

  Future<Note> duplicate(String id) async => Note.fromJson((await _dio.post('/notes/$id/duplicate')).data['note']);

  Future<Attachment> uploadImage(String noteId, File file) => uploadAttachment(noteId, file);

  Future<Attachment> uploadAttachment(String noteId, File file) async {
    final form = FormData.fromMap({'file': await MultipartFile.fromFile(file.path)});
    final resp = await _dio.post('/notes/$noteId/attachments', data: form);
    return Attachment.fromJson(resp.data['attachment']);
  }

  Future<List<Collaborator>> listCollaborators(String noteId) async {
    final resp = await _dio.get('/notes/$noteId/collaborators');
    return (resp.data['collaborators'] as List).map((c) => Collaborator.fromJson(c)).toList();
  }

  Future<Collaborator> addCollaborator(String noteId, String email, String role) async {
    final resp = await _dio.post('/notes/$noteId/collaborators', data: {'email': email, 'role': role});
    return Collaborator.fromJson(resp.data['collaborator']);
  }

  Future<Collaborator> updateCollaborator(String noteId, String collaboratorId, String role) async {
    final resp = await _dio.patch('/notes/$noteId/collaborators/$collaboratorId', data: {'role': role});
    return Collaborator.fromJson(resp.data['collaborator']);
  }

  Future<void> removeCollaborator(String noteId, String collaboratorId) =>
      _dio.delete('/notes/$noteId/collaborators/$collaboratorId');
}
