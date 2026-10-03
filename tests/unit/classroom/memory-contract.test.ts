// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { MemoryClassroomRepository } from '@/features/classroom/infrastructure/memory-classroom-repository';
import { classroomContract } from '../../support/classroom-contract';

// La misma batería corre contra PostgreSQL en tests/integration/classroom-postgres.test.ts.
classroomContract('memoria', () => new MemoryClassroomRepository(randomUUID));
