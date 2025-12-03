import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TranslationParagraph } from './translation-paragraph.entity';
import { User } from '../../user/entities/user.entity';

@Entity('translation_documents')
export class TranslationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ default: 'en' })
  sourceLanguage: string;

  @Column({ default: 'zh' })
  targetLanguage: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'error';

  @Column({ nullable: true })
  sourceFormat: 'url' | 'pdf' | 'html' | 'markdown';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: 0 })
  totalParagraphs: number;

  @Column({ default: 0 })
  translatedParagraphs: number;

  @OneToMany(() => TranslationParagraph, (paragraph) => paragraph.document, {
    eager: false,
    cascade: true,
  })
  paragraphs: TranslationParagraph[];

  @ManyToOne(() => User, (user) => user.documents, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
