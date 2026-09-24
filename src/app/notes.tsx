import { styles } from '@/styles/screens/notes.styles';
import * as Clipboard from 'expo-clipboard';
import { createElement, Fragment, useRef, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { applyNoteFormat, type NoteFormat, parseNoteLine } from '@/features/notes/note-format';
import type { Note } from '@/features/tasks/model';
import { useTasks } from '@/features/tasks/task-store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { copyNoteImage, pasteNoteImage, pickNoteImages, removeNoteImage } from '@/services/note-images';
import { confirmAction } from '@/utils/confirm-action';
import { formatDate } from '@/utils/date';

type NotesView = 'list' | 'tiles';

export default function NotesScreen() {
  const colors = useAppTheme();
  const { notes, folders, deleteNote } = useTasks();
  const [editing, setEditing] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<NotesView>('list');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const edit = (note: Note | null) => { setEditing(note); setShowForm(true); };
  const chooseView = (next: NotesView) => { setView(next); setShowViewMenu(false); };

  const remove = (note: Note) => {
    confirmAction('Delete note?', `“${note.title}” will be permanently deleted.`, () => deleteNote(note.id));
  };
  const copy = async (note: Note) => {
    const copied = await Clipboard.setStringAsync([note.title, note.body].filter(Boolean).join('\n\n')).catch(() => false);
    Alert.alert(copied ? 'Copied' : 'Copy failed', copied ? 'Note copied to clipboard.' : 'The clipboard is unavailable. Please try again.');
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={[styles.kicker, { color: colors.primary }]}>CAPTURE</Text><View style={styles.headingRow}><Text style={[styles.title, { color: colors.text }]}>Notes</Text><View style={styles.viewSelector}><Pressable accessibilityLabel={`Notes view: ${view}`} accessibilityRole="button" onPress={() => setShowViewMenu((open) => !open)} style={[styles.viewButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={view === 'list' ? 'view-list' : 'grid-view'} size={18} tintColor={colors.primary} /><Text style={[styles.viewButtonText, { color: colors.text }]}>{view === 'list' ? 'List' : 'Tiles'}</Text><AppIcon name="arrow-drop-down" size={20} tintColor={colors.textSecondary} /></Pressable>{showViewMenu && <View style={[styles.viewMenu, { backgroundColor: colors.surface, borderColor: colors.outline }]}>{(['list', 'tiles'] as const).map((option) => <Pressable key={option} accessibilityRole="menuitem" onPress={() => chooseView(option)} style={[styles.viewOption, option === view && { backgroundColor: colors.primaryContainer }]}><AppIcon name={option === 'list' ? 'view-list' : 'grid-view'} size={18} tintColor={colors.primary} /><Text style={[styles.viewOptionText, { color: colors.text }]}>{option === 'list' ? 'List' : 'Tiles'}</Text>{option === view && <AppIcon name="check" size={17} tintColor={colors.primary} />}</Pressable>)}</View>}</View></View><Text style={[styles.subtitle, { color: colors.textSecondary }]}>{notes.length} note{notes.length === 1 ? '' : 's'} connected to your folders.</Text></View>
        {notes.length ? <View style={[styles.notes, view === 'list' ? styles.list : styles.tiles]}>{notes.map((note, index) => {
          const folder = folders.find((item) => item.id === note.folderId);
          return <View key={note.id} style={[styles.note, view === 'list' ? styles.noteList : styles.noteTile, { backgroundColor: index % 3 === 0 ? colors.primaryContainer : colors.surface, borderColor: colors.outline }]}>
            <View style={styles.noteTop}>
              <View style={styles.folderInfo}><View style={[styles.folderIcon, { backgroundColor: folder?.color ?? colors.primary }]}><AppIcon name="notes" size={17} tintColor="#FFFFFF" /></View><Text style={[styles.folderName, { color: colors.textSecondary }]}>{folder?.name ?? 'Unsorted'}</Text></View>
            </View>
            <Pressable onPress={() => edit(note)} style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
              {!!note.imageUris.length && <NoteGallery images={note.imageUris} label={note.title} />}
              <FormattedNoteBody body={note.body} numberOfLines={view === 'list' ? 3 : note.imageUris.length ? 3 : 5} />
            </Pressable>
            <View style={styles.noteFooter}><Text style={[styles.updated, { color: colors.textSecondary }]}>Updated {formatDate(note.updatedAt)}</Text><View style={styles.noteActions}><Pressable accessibilityLabel={`Copy ${note.title}`} onPress={() => copy(note)} style={styles.iconButton}><AppIcon name="content-copy" size={18} tintColor={colors.textSecondary} /></Pressable><Pressable accessibilityLabel={`Edit ${note.title}`} onPress={() => edit(note)} style={styles.iconButton}><AppIcon name="edit" size={19} tintColor={colors.primary} /></Pressable><Pressable accessibilityLabel={`Delete ${note.title}`} onPress={() => remove(note)} style={styles.iconButton}><AppIcon name="delete-outline" size={19} tintColor={colors.error} /></Pressable></View></View>
          </View>;
        })}</View> : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="note-add" size={26} tintColor={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>No notes yet</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Capture an idea, checklist, or context for a task.</Text><Pressable onPress={() => edit(null)} style={[styles.emptyButton, { backgroundColor: colors.primary }]}><Text style={styles.emptyButtonText}>Create note</Text></Pressable></View>}
      </ScrollView>
    </SafeAreaView>
    <FloatingActionButton icon="edit-note" label="Create note" onPress={() => edit(null)} />
    {showForm && <NoteForm note={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
  </View>;
}

function NoteForm({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const colors = useAppTheme();
  const { folders, addNote, updateNote, deleteNote } = useTasks();
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const bodyInput = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [folderId, setFolderId] = useState(note?.folderId ?? folders[0]?.id ?? 'uncategorized');
  const originalImages = note?.imageUris ?? [];
  const [imageUris, setImageUris] = useState(originalImages);
  const close = () => { imageUris.filter((uri) => !originalImages.includes(uri)).forEach(removeNoteImage); onClose(); };

  const chooseImage = async () => {
    try {
      const images = await pickNoteImages();
      if (images.length) setImageUris((current) => [...new Set([...current, ...images])]);
    } catch {
      Alert.alert('Image unavailable', 'The selected image could not be attached.');
    }
  };
  const pasteImage = async () => {
    try {
      const image = await pasteNoteImage();
      if (image) setImageUris((current) => current.includes(image) ? current : [...current, image]);
      else Alert.alert('No image found', 'Copy an image first, then try again.');
    } catch {
      Alert.alert('Paste failed', 'The clipboard image could not be attached.');
    }
  };
  const save = () => {
    if (!title.trim()) { Alert.alert('Note title required', 'Enter a title before saving.'); return; }
    const input = { title: title.trim(), body: body.trim(), folderId, imageUris };
    if (note) updateNote(note.id, input); else addNote(input);
    onClose();
  };
  const remove = () => {
    if (!note) return;
    confirmAction('Delete note?', `“${note.title}” will be permanently deleted.`, () => {
      imageUris.filter((uri) => !originalImages.includes(uri)).forEach(removeNoteImage);
      deleteNote(note.id);
      onClose();
    });
  };
  const format = (action: NoteFormat) => {
    const next = applyNoteFormat(body, selection, action);
    setBody(next.text);
    setSelection(next.selection);
    requestAnimationFrame(() => bodyInput.current?.focus());
  };
  const removeImage = (uri: string) => {
    if (!originalImages.includes(uri)) removeNoteImage(uri);
    setImageUris((current) => current.filter((image) => image !== uri));
  };

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
      <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}><Pressable hitSlop={12} onPress={close}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text></Pressable><Text style={[styles.modalTitle, { color: colors.text }]}>{note ? 'Edit note' : 'New note'}</Text><Pressable hitSlop={12} onPress={save}><Text style={{ color: colors.primary, fontWeight: '800' }}>Save</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextInput autoFocus value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.textSecondary} style={[styles.titleInput, { color: colors.text }]} />
          <ScrollView style={styles.folderScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderRow}>{folders.map((folder) => <Pressable key={folder.id} onPress={() => setFolderId(folder.id)} style={[styles.folderChip, { backgroundColor: folder.id === folderId ? colors.primaryContainer : colors.surface, borderColor: folder.id === folderId ? colors.primary : colors.outline }]}><View style={[styles.dot, { backgroundColor: folder.color }]} /><Text style={{ color: colors.text, fontWeight: '600' }}>{folder.name}</Text></Pressable>)}</ScrollView>
          <View style={styles.imageActions}><ImageButton icon="add-photo-alternate" label="Add photos" onPress={chooseImage} /><ImageButton icon="content-paste" label="Paste image" onPress={pasteImage} /></View>
          {!!imageUris.length && <NoteGallery images={imageUris} label="Note attachment" onRemove={removeImage} />}
          <View style={[styles.formatToolbar, { backgroundColor: colors.surface, borderColor: colors.outline }]}><FormatButton icon="format-bold" label="Bold" onPress={() => format('bold')} /><FormatButton icon="format-italic" label="Italic" onPress={() => format('italic')} /><FormatButton icon="format-list-bulleted" label="Bullets" onPress={() => format('bullet')} /><FormatButton icon="format-list-numbered" label="Numbered list" onPress={() => format('numbered')} /></View>
          <TextInput ref={bodyInput} multiline value={body} selection={selection} onSelectionChange={(event) => setSelection(event.nativeEvent.selection)} onChangeText={setBody} placeholder="Start writing…" placeholderTextColor={colors.textSecondary} textAlignVertical="top" style={[styles.bodyInput, imageUris.length > 0 && styles.bodyInputWithImage, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.outline }]} />
          {note && <Pressable onPress={remove} style={styles.deleteNote}><AppIcon name="delete-outline" size={20} tintColor={colors.error} /><Text style={{ color: colors.error, fontWeight: '800' }}>Delete note</Text></Pressable>}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

function ImageButton({ icon, label, onPress }: { icon: 'add-photo-alternate' | 'content-paste'; label: string; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={icon} size={18} tintColor={colors.primary} /><Text style={[styles.imageButtonText, { color: colors.primary }]}>{label}</Text></Pressable>;
}

function FormatButton({ icon, label, onPress }: { icon: 'format-bold' | 'format-italic' | 'format-list-bulleted' | 'format-list-numbered'; label: string; onPress: () => void }) {
  const colors = useAppTheme();
  return <Pressable accessibilityLabel={label} onPress={onPress} style={styles.formatButton}><AppIcon name={icon} size={21} tintColor={colors.primary} /></Pressable>;
}

function FormattedNoteBody({ body, numberOfLines }: { body: string; numberOfLines: number }) {
  const colors = useAppTheme();
  if (!body) return <Text style={[styles.noteBody, { color: colors.textSecondary }]}>Tap to add details</Text>;
  return <Text numberOfLines={numberOfLines} style={[styles.noteBody, { color: colors.textSecondary }]}>{body.split('\n').map((line, lineIndex) => {
    const parsed = parseNoteLine(line);
    return <Fragment key={lineIndex}>{lineIndex > 0 && '\n'}{parsed.prefix}{parsed.tokens.map((token, tokenIndex) => <Text key={tokenIndex} style={{ fontWeight: token.bold ? '800' : undefined, fontStyle: token.italic ? 'italic' : undefined }}>{token.text}</Text>)}</Fragment>;
  })}</Text>;
}

function NoteGallery({ images, label, onRemove }: { images: string[]; label: string; onRemove?: (uri: string) => void }) {
  const colors = useAppTheme();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeUri = images[activeIndex ?? 0];
  return <><ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{images.map((uri, index) => <View key={uri} style={styles.galleryItem}><NoteImage uri={uri} label={`${label} ${index + 1}`} onView={() => setActiveIndex(index)} />{onRemove && <Pressable accessibilityLabel={`Remove image ${index + 1}`} onPress={() => onRemove(uri)} style={[styles.removeImageButton, { backgroundColor: colors.surface }]}><AppIcon name="close" size={18} tintColor={colors.error} /></Pressable>}</View>)}</ScrollView>{activeIndex !== null && <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => setActiveIndex(null)}><View style={styles.imageViewer}><View style={styles.imageViewerBackdrop} /><Pressable accessibilityLabel="Close image" onPress={() => setActiveIndex(null)} style={styles.imageViewerClose}><AppIcon name="close" size={28} tintColor="#FFFFFF" /></Pressable><FlatList style={styles.imageViewerList} data={images} horizontal pagingEnabled initialScrollIndex={activeIndex} getItemLayout={(_, index) => ({ length: width, offset: width * index, index })} keyExtractor={(uri) => uri} onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))} showsHorizontalScrollIndicator={false} renderItem={({ item, index }) => <View style={[styles.imageViewerPage, { width }]}><ViewerImage uri={item} label={`${label} ${index + 1}`} /></View>} /><Text style={styles.imageViewerCounter}>{activeIndex + 1} / {images.length}</Text><Pressable accessibilityLabel="Copy image" onPress={() => copyImage(activeUri)} style={styles.imageViewerCopy}><AppIcon name="content-copy" size={20} tintColor="#FFFFFF" /><Text style={styles.imageViewerCopyText}>Copy</Text></Pressable></View></Modal>}</>;
}

function ViewerImage({ uri, label }: { uri: string; label: string }) {
  if (Platform.OS === 'web') return createElement('img', { src: uri, alt: label, draggable: false, style: { width: '100%', height: '80%', objectFit: 'contain' } });
  return <Image accessibilityLabel={label} source={{ uri }} resizeMode="contain" style={styles.imageViewerImage} />;
}

async function copyImage(uri: string) {
  try {
    await copyNoteImage(uri);
    Alert.alert('Image copied', 'The image is ready to paste.');
  } catch {
    Alert.alert('Copy failed', 'The image could not be copied.');
  }
}

function NoteImage({ uri, label, onView }: { uri: string; label: string; onView: () => void }) {
  const colors = useAppTheme();
  return <View style={[styles.imageCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}><Pressable accessibilityLabel={`View ${label}`} onPress={(event) => { event.stopPropagation(); onView(); }} style={styles.imageTap}><Image accessibilityLabel={label} source={{ uri }} resizeMode="cover" style={[styles.noteImage, styles.noteImageThumb]} /></Pressable><Pressable accessibilityLabel="Copy image" android_ripple={{ color: colors.primaryContainer }} onPress={(event) => { event.stopPropagation(); copyImage(uri); }} style={[styles.copyImageButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name="content-copy" size={18} tintColor={colors.primary} /></Pressable></View>;
}
