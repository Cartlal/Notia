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

  Future<void> setLock(String id, String pin) => _dio.post('/notes/$id/lock', data: {'pin': pin});
  Future<void> removeLock(String id) => _dio.delete('/notes/$id/lock');
  Future<bool> verifyLock(String id, String pin) async {
    try {
      await _dio.post('/notes/$id/unlock', data: {'pin': pin});
      return true;
    } on DioException {
      return false;
    }
  }

  Future<Attachment> uploadImage(String noteId, File file) async {
    final form = FormData.fromMap({'file': await MultipartFile.fromFile(file.path)});
    final resp = await _dio.post('/notes/$noteId/attachments', data: form);
    return Attachment.fromJson(resp.data['attachment']);
  }
}
