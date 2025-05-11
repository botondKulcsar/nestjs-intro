import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { testConfig } from './../config/test.config';

export class TestSetup {
  // NestJs app instance we'll test against
  app: INestApplication;
  // db connection that lets us clean data
  dataSource: DataSource;

  // static factory method - easier to use than constructor
  static async create(module: any) {
    const instance = new TestSetup();
    await instance.init(module);
    return instance;
  }
  // set up testing module with custom config
  private async init(module: any) {
    // creating testing module with our app's module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [module],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key.includes('database')) return testConfig.database;
          if (key.includes('app')) return testConfig.app;
          if (key.includes('auth')) return testConfig.auth;
          return null;
        },
      })
      .compile();

    // create NestJs app
    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        exceptionFactory: (errors: ValidationError[]) => {
          console.log(errors);
        },
      }),
    );
    // get db connection
    this.dataSource = moduleFixture.get(DataSource);
    // init app (starts servers, connects to db etc)
    await this.app.init();
  }

  // db operations
  // cleans list of tables between tests
  async cleanup() {
    // get all entity metadata to find table names
    const entities = this.dataSource.entityMetadatas;
    // create list of table names for SQL query
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    // TRUNCATE removes all data
    // RESTART IDENTITY resets auto-increment counters
    // CASCADE handles foreign key relationships
    await this.dataSource.query(
      `TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
  }

  // properly close database and app after tests
  async teardown() {
    await this.dataSource.destroy(); //close db connection
    await this.app.close(); //shut down NestJs ap
  }
}
