import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Note, Folder, Tag } from "@/lib/types";

export function useNotes(view: string, folderId?: string | null) {
  return useQuery({
    queryKey: ["notes", view, folderId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (view) params.view = view;
      if (folderId) params.folderId = folderId;
      const { data } = await api.get<{ notes: Note[] }>("/notes", { params });
      return data.notes;
    },
  });
}

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<{ folders: Folder[] }>("/folders")).data.folders,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api.get<{ tags: Tag[] }>("/tags")).data.tags,
  });
}

export function useNoteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes"] });

  const create = useMutation({
    mutationFn: async (payload: Partial<Note> = {}) => (await api.post<{ note: Note }>("/notes", payload)).data.note,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Note> & { id: string }) =>
      (await api.patch<{ note: Note }>(`/notes/${id}`, payload)).data.note,
    onSuccess: invalidate,
  });

  const action = (path: string) =>
    useMutation({
      mutationFn: async (id: string) => (await api.post<{ note: Note }>(`/notes/${id}/${path}`)).data.note,
      onSuccess: invalidate,
    });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/notes/${id}`),
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    remove,
    pin: action("pin"),
    favorite: action("favorite"),
    archive: action("archive"),
    trash: action("trash"),
    restore: action("restore"),
    duplicate: action("duplicate"),
  };
}
