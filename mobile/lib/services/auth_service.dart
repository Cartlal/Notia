import 'api_client.dart';

class AuthUser {
  final String id;
  final String email;
  final String name;

  AuthUser({required this.id, required this.email, required this.name});

  factory AuthUser.fromJson(Map<String, dynamic> json) =>
      AuthUser(id: json['id'], email: json['email'], name: json['name']);
}

class AuthService {
  final _dio = ApiClient.instance.dio;

  Future<AuthUser> login(String email, String password) async {
    final resp = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    await ApiClient.instance.saveTokens(
      accessToken: resp.data['accessToken'],
      refreshToken: resp.data['refreshToken'],
    );
    return AuthUser.fromJson(resp.data['user']);
  }

  Future<AuthUser> register(String name, String email, String password) async {
    final resp = await _dio.post('/auth/register', data: {'name': name, 'email': email, 'password': password});
    await ApiClient.instance.saveTokens(
      accessToken: resp.data['accessToken'],
      refreshToken: resp.data['refreshToken'],
    );
    return AuthUser.fromJson(resp.data['user']);
  }

  Future<AuthUser?> currentUser() async {
    final token = await ApiClient.instance.accessToken;
    if (token == null) return null;
    try {
      final resp = await _dio.get('/auth/me');
      return AuthUser.fromJson(resp.data['user']);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
    await ApiClient.instance.clearTokens();
  }
}
