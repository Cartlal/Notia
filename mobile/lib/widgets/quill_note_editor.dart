import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import '../theme/app_theme.dart';

enum PaperStyle { none, ruled, grid }

/// Loads a note's stored content into a Quill document.
///
/// Notes created/edited on the web app store HTML in `content` with no
/// `contentJson`; notes created here store the Quill Delta as JSON in
/// `contentJson`. There is no shared rich-text format between the two
/// editors, so cross-platform formatting isn't preserved byte-for-byte —
/// loading falls back to plain text (stripped of HTML tags) when there's
/// no Delta to read, which keeps the words intact even if bold/headings
/// made on web don't carry over as Quill formatting.
quill.Document documentFromNote({
  required String? contentJson,
  required String? htmlContent,
}) {
  if (contentJson != null && contentJson.isNotEmpty) {
    try {
      return quill.Document.fromJson(jsonDecode(contentJson) as List);
    } catch (_) {
      // Fall through to the plain-text path below.
    }
  }
  final plain = (htmlContent ?? '').replaceAll(RegExp(r'<[^>]*>'), '').trim();
  final doc = quill.Document();
  if (plain.isNotEmpty) doc.insert(0, plain);
  return doc;
}

class QuillNoteEditor extends StatefulWidget {
  final quill.QuillController controller;
  final bool editable;
  final PaperStyle paperStyle;
  final ValueChanged<PaperStyle>? onPaperStyleChanged;

  const QuillNoteEditor({
    super.key,
    required this.controller,
    this.editable = true,
    this.paperStyle = PaperStyle.none,
    this.onPaperStyleChanged,
  });

  @override
  State<QuillNoteEditor> createState() => _QuillNoteEditorState();
}

class _QuillNoteEditorState extends State<QuillNoteEditor> {
  final _focusNode = FocusNode();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _focusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editor = quill.QuillEditor.basic(
      controller: widget.controller,
      focusNode: _focusNode,
      scrollController: _scrollController,
      config: quill.QuillEditorConfig(
        placeholder: 'Start writing…',
        scrollable: false,
        expands: false,
        padding: const EdgeInsets.symmetric(vertical: 4),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.editable) ...[
          // A wrapping multi-row toolbar (flutter_quill's default) eats a
          // third of the screen on phone widths — single row, horizontally
          // scrollable instead, the same pattern Notion/Google Docs use on
          // mobile.
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: quill.QuillSimpleToolbar(
              controller: widget.controller,
              config: const quill.QuillSimpleToolbarConfig(
                multiRowsDisplay: false,
                showFontFamily: true,
                showFontSize: true,
                showBoldButton: true,
                showItalicButton: true,
                showSmallButton: false,
                showUnderLineButton: true,
                showStrikeThrough: true,
                showInlineCode: true,
                // Only "highlight" (background), matching the web editor —
                // arbitrary text color isn't a web feature.
                showColorButton: false,
                showBackgroundColorButton: true,
                showClearFormat: true,
                showAlignmentButtons: false,
                showHeaderStyle: true,
                showListNumbers: true,
                showListBullets: true,
                showListCheck: true,
                showCodeBlock: true,
                showQuote: true,
                showIndent: false,
                showLink: true,
                showUndo: true,
                showRedo: true,
                showSearchButton: false,
                showSubscript: false,
                showSuperscript: false,
              ),
            ),
          ),
          if (widget.onPaperStyleChanged != null)
            _PaperStyleBar(
              value: widget.paperStyle,
              onChanged: widget.onPaperStyleChanged!,
            ),
          const Divider(height: 1, color: AppColors.border),
        ],
        Expanded(
          child: _PaperBackground(
            style: widget.paperStyle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: editor,
            ),
          ),
        ),
      ],
    );
  }
}

class _PaperStyleBar extends StatelessWidget {
  final PaperStyle value;
  final ValueChanged<PaperStyle> onChanged;
  const _PaperStyleBar({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Widget button(PaperStyle s, IconData icon, String tooltip) {
      final selected = value == s;
      return IconButton(
        tooltip: tooltip,
        icon: Icon(
          icon,
          size: 18,
          color: selected ? AppColors.brand700 : AppColors.textMuted,
        ),
        style: IconButton.styleFrom(
          backgroundColor: selected ? AppColors.brand100 : null,
        ),
        onPressed: () => onChanged(s),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          button(PaperStyle.none, Icons.description_outlined, 'Plain page'),
          button(PaperStyle.ruled, Icons.view_headline, 'Ruled page'),
          button(PaperStyle.grid, Icons.grid_on_outlined, 'Grid page'),
        ],
      ),
    );
  }
}

/// Paints ruled/grid lines behind the editor, matching web's
/// .paper-ruled/.paper-grid CSS (1.75em line spacing, a red margin rule).
class _PaperBackground extends StatelessWidget {
  final PaperStyle style;
  final Widget child;
  const _PaperBackground({required this.style, required this.child});

  @override
  Widget build(BuildContext context) {
    if (style == PaperStyle.none) return child;
    return CustomPaint(
      painter: _PaperPainter(style),
      child: Padding(
        padding: EdgeInsets.only(left: style == PaperStyle.ruled ? 16 : 0),
        child: child,
      ),
    );
  }
}

class _PaperPainter extends CustomPainter {
  final PaperStyle style;
  _PaperPainter(this.style);

  static const double _lineHeight = 28; // ~1.75em at 16px base font

  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = AppColors.border
      ..strokeWidth = 1;

    for (double y = _lineHeight; y < size.height; y += _lineHeight) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
    }
    if (style == PaperStyle.grid) {
      for (double x = _lineHeight; x < size.width; x += _lineHeight) {
        canvas.drawLine(Offset(x, 0), Offset(x, size.height), linePaint);
      }
    }
    if (style == PaperStyle.ruled) {
      final marginPaint = Paint()
        ..color = const Color(0xFFE8A3A3)
        ..strokeWidth = 2;
      canvas.drawLine(const Offset(2, 0), Offset(2, size.height), marginPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PaperPainter oldDelegate) =>
      oldDelegate.style != style;
}
