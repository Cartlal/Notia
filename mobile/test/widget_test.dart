import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:notia_mobile/main.dart';

void main() {
  testWidgets('App boots to the login screen when signed out', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: NotiaApp()));
    await tester.pump();

    expect(find.text('Welcome back'), findsOneWidget);
  });
}
