import * as request from 'supertest';

import { AppModule } from './../src/app.module';
import { TestSetup } from './utils/test-setup';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../src/users/user.entity';
// import { Role } from '../src/users/role.enum';

// import { PasswordService } from '../src/users/password/password.service';
// import { Repository } from 'typeorm';
// import { JwtService } from '@nestjs/jwt';
// import { title } from 'process';
import { TaskStatus } from '../src/tasks/task.model';

describe('Tasks (e2e)', () => {
  let testSetup: TestSetup;

  let authToken: string;
  let taskId: string;

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    authToken = loginResponse.body.accessToken;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testSetup.app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.OPEN,
        labels: [
          {
            name: 'test',
          },
        ],
      });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    taskId = response.body.id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('should not allow access to other users tasks', async () => {
    const otherUser = { ...testUser, email: 'other@example.com' };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const otherToken = loginResponse.body.accessToken;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('should list users tasks ONLY', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.meta.total).toBe(1);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.data[0].title).toBe('Test Task');
      });

    const otherUser = { ...testUser, email: 'other@example.com' };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(otherUser)
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const otherToken = loginResponse.body.accessToken;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testSetup.app.getHttpServer())
      .get(`/tasks`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.meta.total).toBe(0);
      });
  });
});
