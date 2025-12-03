import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TranslationDocument } from './translation-document.entity';

@Entity('translation_paragraphs')
export class TranslationParagraph {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @Column({ type: 'varchar', length: 50 })
  type: 'heading' | 'paragraph' | 'code' | 'table' | 'list' | 'note' | 'warning' | 'tip';

  @Column({ type: 'text' })
  original: string;

  @Column({ type: 'text', nullable: true })
  translated: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  translationStatus: 'pending' | 'translating' | 'completed' | 'error';

  @Column({ type: 'jsonb', nullable: true })
  glossaryTerms: Array<{
    id: string;
    english: string;
    chinese: string;
    category: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @ManyToOne(() => TranslationDocument, (doc) => doc.paragraphs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: TranslationDocument;

  @Column()
  documentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
