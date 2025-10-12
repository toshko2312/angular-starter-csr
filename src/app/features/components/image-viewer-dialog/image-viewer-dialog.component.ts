import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-image-viewer-dialog',
  imports: [SharedModule],
  templateUrl: './image-viewer-dialog.component.html',
  styleUrl: './image-viewer-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerDialogComponent implements OnInit {
  image?: any
  imageTitle?: string
  currentIndex?: number

  constructor(private config: DynamicDialogConfig) { }

  ngOnInit(): void { 
    this.image = this.config.data.image;
    this.imageTitle = this.config.data.imageTitle;
    this.currentIndex = this.config.data.currentIndex;
  }

}
