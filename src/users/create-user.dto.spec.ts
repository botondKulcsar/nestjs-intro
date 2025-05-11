import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  let dto = new CreateUserDto();

  beforeEach(() => {
    dto = new CreateUserDto();
    dto.email = 'test@test.com';
    dto.name = 'Botond';
    dto.password = '123456A#';
  });

  it('should validate complet valid data', async () => {
    // 3xA
    // arrange
    // act
    const errors = await validate(dto);
    // assert
    expect(errors.length).toBe(0);
  });

  it('should fail on invalid email', async () => {
    // arrange
    dto.email = 'test';
    // act
    const errors = await validate(dto);
    // assert
    expect(errors.length).toBeGreaterThan(0);
    // console.log(errors);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  const testPassword = async (password: string, message: string) => {
    dto.password = password;
    const errors = await validate(dto);

    const passwordError = errors.find((error) => error.property === 'password');
    expect(passwordError).not.toBeUndefined();
    const messages = Object.values(passwordError?.constraints ?? {});
    expect(messages).toContain(message);
  };

  // 1) at least 1 uppercase letter
  // 2) at least 1 number
  // 3) at least 1 special character

  it('should fail without 1 uppercase letter', async () => {
    await testPassword(
      'abcdefg',
      'Password must contain at least 1 uppercase letter',
    );
  });

  it('should fail without at least 1 number', async () => {
    await testPassword('abcdefgA', 'Password must contain at least 1 number');
  });

  it('should fail without at least 1 special character', async () => {
    await testPassword(
      'abcdefgA1',
      'Password must contain at least 1 special character',
    );
  });
});
