import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('glossary_terms')
export class GlossaryTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  english: string;

  @Column()
  chinese: string;

  @Column()
  category: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'jsonb', nullable: true })
  examples: string[];

  @Column({ type: 'jsonb', nullable: true })
  relatedTerms: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
