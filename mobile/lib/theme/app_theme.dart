import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Mirrors web/src/index.css's CSS variables exactly, so the Flutter app
/// (Android + Windows) reads as the same product as the web app rather
/// than a generic Material app in similar colors.
class AppColors {
  static const bg = Color(0xFFFFFFFF);
  static const bgSubtle = Color(0xFFF7F7F8);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFE4E4E7);
  static const text = Color(0xFF18181B);
  static const textMuted = Color(0xFF6B6B73);
  static const hover = Color(0x0D000000); // rgba(0,0,0,0.05)
  static const active = Color(0x14000000); // rgba(0,0,0,0.08)

  static const bgDark = Color(0xFF0E0E10);
  static const bgSubtleDark = Color(0xFF151517);
  static const surfaceDark = Color(0xFF1A1A1D);
  static const borderDark = Color(0xFF2A2A2E);
  static const textDark = Color(0xFFF6F6F7);
  static const textMutedDark = Color(0xFFA3A3AB);

  static const brand50 = Color(0xFFF6F6F7);
  static const brand100 = Color(0xFFECECEE);
  static const brand400 = Color(0xFF86868F);
  static const brand600 = Color(0xFF27272A);
  static const brand700 = Color(0xFF18181B);
  static const accent500 = Color(0xFFE8B923);
}

class AppTheme {
  static ThemeData light() => _build(
        background: AppColors.bg,
        bgSubtle: AppColors.bgSubtle,
        surface: AppColors.surface,
        border: AppColors.border,
        text: AppColors.text,
        textMuted: AppColors.textMuted,
        brightness: Brightness.light,
      );

  static ThemeData dark() => _build(
        background: AppColors.bgDark,
        bgSubtle: AppColors.bgSubtleDark,
        surface: AppColors.surfaceDark,
        border: AppColors.borderDark,
        text: AppColors.textDark,
        textMuted: AppColors.textMutedDark,
        brightness: Brightness.dark,
      );

  static ThemeData _build({
    required Color background,
    required Color bgSubtle,
    required Color surface,
    required Color border,
    required Color text,
    required Color textMuted,
    required Brightness brightness,
  }) {
    final textTheme = GoogleFonts.interTextTheme().apply(bodyColor: text, displayColor: text);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: background,
      canvasColor: bgSubtle,
      textTheme: textTheme,
      fontFamily: GoogleFonts.inter().fontFamily,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: AppColors.brand600,
        onPrimary: Colors.white,
        secondary: AppColors.accent500,
        onSecondary: Colors.black,
        error: const Color(0xFFDC2626),
        onError: Colors.white,
        surface: surface,
        onSurface: text,
      ),
      dividerColor: border,
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: text,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
        iconTheme: IconThemeData(color: textMuted),
      ),
      // Flat bordered cards, not Material's default elevated/shadowed look —
      // matches .note-card in web/src/index.css (surface fill + 1px border).
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.brand400, width: 1.5),
        ),
        labelStyle: TextStyle(color: textMuted),
        hintStyle: TextStyle(color: textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand600,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: AppColors.brand600),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(foregroundColor: textMuted),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: textMuted,
        textColor: text,
        selectedTileColor: AppColors.brand100,
        selectedColor: AppColors.brand700,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border),
        ),
      ),
      drawerTheme: DrawerThemeData(backgroundColor: bgSubtle),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.brand100,
        labelStyle: const TextStyle(color: AppColors.brand700, fontSize: 12),
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      splashFactory: NoSplash.splashFactory,
      highlightColor: AppColors.hover,
    );
  }
}
