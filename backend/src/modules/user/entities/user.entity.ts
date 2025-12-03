import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TranslationDocument } from '../../translation/entities/translation-document.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: 'user' | 'pro' | 'enterprise';

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ default: 0 })
  translationCount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  googleId: string;

  @OneToMany(() => TranslationDocument, (doc) => doc.user, {
    cascade: true,
  })
  documents: TranslationDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
