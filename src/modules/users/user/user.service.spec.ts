import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import type { IUserRepository } from './interfaces/user.repository.interface';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    getProfile: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const date = new Date('2025-09-08T17:25:18.802Z');
  const payload: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };
  const userEntity: UserEntity = {
    id: 1,
    cpf: '41579506070',
    email: 'johndoe123@example.com',
    name: 'John Doe',
    phone: '011980028922',
    role: 'elder',
    createdAt: date,
    updatedAt: date,
    elderProfile: {
      userId: 1,
      caregiverId: 15,
      bpm: 72,
      deviceId: '24Wwsc24',
      createdAt: date,
      updatedAt: date,
    },
    caregiverProfile: {
      userId: 1,
      createdAt: date,
    },
  };

  beforeEach(async () => {
    userRepository = {
      getProfile: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'UsersService',
          useClass: UserService,
        },
        {
          provide: 'UserRepository',
          useValue: userRepository satisfies jest.Mocked<IUserRepository>,
        },
      ],
    }).compile();

    service = moduleRef.get('UsersService');
  });

  afterEach(() => jest.resetAllMocks());

  describe('getProfile', () => {
    it('returns the user profile returned by repository', async () => {
      userRepository.getProfile.mockResolvedValueOnce(userEntity);

      await expect(service.getProfile(payload)).resolves.toEqual(userEntity);
      expect(userRepository.getProfile).toHaveBeenCalledTimes(1);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      userRepository.getProfile.mockRejectedValueOnce(repositoryError);

      await expect(service.getProfile(payload)).rejects.toBe(repositoryError);
    });

    it('throws when repository returns null', async () => {
      userRepository.getProfile.mockResolvedValueOnce(null);

      await expect(service.getProfile(payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'newJohnDoe',
      phone: '011980028944',
    };

    it('returns the updated user returned by repository', async () => {
      userRepository.update.mockResolvedValueOnce({
        ...userEntity,
        ...updateUserDto,
      });

      await expect(service.update(payload, updateUserDto)).resolves.toEqual({
        ...userEntity,
        ...updateUserDto,
      });
      expect(userRepository.update).toHaveBeenCalledTimes(1);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      userRepository.update.mockRejectedValueOnce(repositoryError);

      await expect(service.update(payload, updateUserDto)).rejects.toBe(
        repositoryError,
      );
    });
  });

  describe('remove', () => {
    it('deletes the current user', async () => {
      userRepository.remove.mockResolvedValueOnce(undefined);

      await expect(service.remove(payload)).resolves.toBeUndefined();
      expect(userRepository.remove).toHaveBeenCalledWith(payload);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      userRepository.remove.mockRejectedValueOnce(repositoryError);

      await expect(service.remove(payload)).rejects.toBe(repositoryError);
    });
  });
});
