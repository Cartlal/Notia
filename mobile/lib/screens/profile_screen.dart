import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _name = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _deleteConfirm = TextEditingController();

  bool _savingName = false;
  bool _savingPassword = false;
  bool _deleting = false;
  String? _passwordError;
  bool _nameSaved = false;
  bool _passwordSaved = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).valueOrNull;
    _name.text = user?.name ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    _deleteConfirm.dispose();
    super.dispose();
  }

  Future<void> _saveName() async {
    setState(() => _savingName = true);
    try {
      await ref.read(authControllerProvider.notifier).updateProfile(name: _name.text.trim());
      setState(() => _nameSaved = true);
    } finally {
      if (mounted) setState(() => _savingName = false);
    }
  }

  Future<void> _changePassword() async {
    setState(() {
      _savingPassword = true;
      _passwordError = null;
      _passwordSaved = false;
    });
    try {
      await ref.read(authServiceProvider).changePassword(
            currentPassword: _currentPassword.text,
            newPassword: _newPassword.text,
          );
      _currentPassword.clear();
      _newPassword.clear();
      setState(() => _passwordSaved = true);
    } catch (_) {
      setState(() => _passwordError = "Couldn't change your password");
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  Future<void> _deleteAccount() async {
    setState(() => _deleting = true);
    try {
      await ref.read(authControllerProvider.notifier).deleteAccount();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile & settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('PROFILE', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    enabled: false,
                    decoration: InputDecoration(labelText: 'Email', hintText: user?.email),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _name,
                    onChanged: (_) => setState(() => _nameSaved = false),
                    decoration: const InputDecoration(labelText: 'Full name'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _savingName ? null : _saveName,
                        child: Text(_savingName ? 'Saving…' : 'Save name'),
                      ),
                      if (_nameSaved) const Padding(padding: EdgeInsets.only(left: 12), child: Text('Saved', style: TextStyle(color: Colors.green))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('CHANGE PASSWORD', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _currentPassword,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Current password'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _newPassword,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'New password (min 8 characters)'),
                  ),
                  if (_passwordError != null)
                    Padding(padding: const EdgeInsets.only(top: 8), child: Text(_passwordError!, style: const TextStyle(color: Colors.red))),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _savingPassword ? null : _changePassword,
                        child: Text(_savingPassword ? 'Updating…' : 'Update password'),
                      ),
                      if (_passwordSaved) const Padding(padding: EdgeInsets.only(left: 12), child: Text('Updated', style: TextStyle(color: Colors.green))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('DANGER ZONE', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.red)),
          const SizedBox(height: 8),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFFCA5A5))),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Permanently deletes your account and every note, folder, and attachment you own. This cannot be undone.',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _deleteConfirm,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(hintText: 'Type "delete" to confirm'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    onPressed: (_deleteConfirm.text.trim().toLowerCase() == 'delete' && !_deleting) ? _deleteAccount : null,
                    child: Text(_deleting ? 'Deleting…' : 'Delete my account'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
