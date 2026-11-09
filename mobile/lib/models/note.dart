class Tag {
  final String id;
  final String name;
  final String? color;

  Tag({required this.id, required this.name, this.color});

  factory Tag.fromJson(Map<String, dynamic> json) =>
      Tag(id: json['id'], name: json['name'], color: json['color']);
}

class Attachment {
  final String id;
  final String fileName;
  final String mimeType;
  final String url;
  final String kind;

  Attachment({
    required this.id,
    required this.fileName,
    required this.mimeType,
    required this.url,
    required this.kind,
  });

  factory Attachment.fromJson(Map<String, dynamic> json) => Attachment(
        id: json['id'],
        fileName: json['fileName'],
        mimeType: json['mimeType'],
        url: json['url'],
        kind: json['kind'],
      );
}

class Note {
  final String id;
  final String title;
  final String? content;
  final String? color;
  final String type;
  final bool isPinned;
  final bool isFavorite;
  final bool isArchived;
  final bool isTrashed;
  final bool isProtected;
  final bool locked;
  final String? folderId;
  final int version;
  final List<Tag> tags;
  final List<Attachment> attachments;
  final DateTime updatedAt;

  Note({
    required this.id,
    required this.title,
    required this.content,
    required this.color,
    required this.type,
    required this.isPinned,
    required this.isFavorite,
    required this.isArchived,
    required this.isTrashed,
    required this.isProtected,
    required this.locked,
    required this.folderId,
    required this.version,
    required this.tags,
    required this.attachments,
    required this.updatedAt,
  });

  factory Note.fromJson(Map<String, dynamic> json) => Note(
        id: json['id'],
        title: json['title'] ?? 'Untitled',
        content: json['content'],
        color: json['color'],
        type: json['type'] ?? 'STANDARD',
        isPinned: json['isPinned'] ?? false,
        isFavorite: json['isFavorite'] ?? false,
        isArchived: json['isArchived'] ?? false,
        isTrashed: json['isTrashed'] ?? false,
        isProtected: json['isProtected'] ?? false,
        locked: json['locked'] ?? false,
        folderId: json['folderId'],
        version: json['version'] ?? 1,
        tags: (json['tags'] as List? ?? []).map((t) => Tag.fromJson(t)).toList(),
        attachments: (json['attachments'] as List? ?? []).map((a) => Attachment.fromJson(a)).toList(),
        updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'title': title,
        'content': content,
        'color': color,
        'type': type,
        'isPinned': isPinned,
        'isFavorite': isFavorite,
        'isArchived': isArchived,
        'isTrashed': isTrashed,
        'isProtected': isProtected,
        'locked': locked,
        'folderId': folderId,
        'version': version,
        'tags': tags.map((t) => {'id': t.id, 'name': t.name, 'color': t.color}).toList(),
        'attachments': attachments
            .map((a) => {'id': a.id, 'fileName': a.fileName, 'mimeType': a.mimeType, 'url': a.url, 'kind': a.kind})
            .toList(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}
