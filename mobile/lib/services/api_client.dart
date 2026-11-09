import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Change for a physical device / production backend. 10.0.2.2 is the
/// Android emulator's alias for the host machine's localhost.
const String kApiBaseUrl = 'http://10.0.2.2:4000';

class ApiClient {
  ApiClient._internal() {
    _dio = Dio(BaseOptions(baseUrl: '$kApiBaseUrl/api'));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _tryRefresh();
          if (refreshed != null) {
            error.requestOptions.headers['Authorization'] = 'Bearer $refreshed';
            final clone = await _dio.fetch(error.requestOptions);
            return handler.resolve(clone);
          }
        }
        handler.next(error);
      },
    ));
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  Dio get dio => _dio;

  Future<String?> _tryRefresh() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return null;
    try {
      final resp = await Dio().post(
        '$kApiBaseUrl/api/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final token = resp.data['accessToken'] as String;
      await _storage.write(key: 'access_token', value: token);
      return token;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    await _storage.write(key: 'access_token', value: accessToken);
    if (refreshToken != null) await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<String?> get accessToken => _storage.read(key: 'access_token');
}
