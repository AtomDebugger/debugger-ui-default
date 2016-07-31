import { File } from 'sig/1.7.4/File'
import { Directory } from 'sig/1.7.4/Directory'
import { TextEditorMarker } from 'sig/1.7.4/TextEditorMarker'
import { CompositeDisposable, Disposable, Emitter } from 'event-kit'

declare module atom {

  declare var exports: {
    File: File,
    Directory: Directory,
    CompositeDisposable: CompositeDisposable,
    Disposable: Disposable,
    Emitter: Emitter,
    TextEditorMarker: typeof TextEditorMarker
  };
}
