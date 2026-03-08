import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Mock data
const mockUsers = [
  {
    id: 'uuid-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'INVESTOR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'uuid-2',
    name: 'Bob',
    email: 'bob@example.com',
    role: 'ENTREPRENEUR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock UsersService
const mockUsersService = {
  findAll: jest.fn().mockResolvedValue(mockUsers),
  findOne: jest.fn((id: string) =>
    Promise.resolve(mockUsers.find((u) => u.id === id)),
  ),
  update: jest.fn((id: string, data: any) =>
    Promise.resolve({ ...mockUsers[0], ...data }),
  ),
  deactivate: jest.fn((id: string) =>
    Promise.resolve({ ...mockUsers[0], isActive: false }),
  ),
  delete: jest.fn((id: string) => Promise.resolve(mockUsers[0])),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService, // inject mock service
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all users', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual(mockUsers);
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });

  it('should return a single user', async () => {
    const user = await controller.findOne('uuid-1');
    expect(user).toEqual(mockUsers[0]);
    expect(mockUsersService.findOne).toHaveBeenCalledWith('uuid-1');
  });

  it('should update a user', async () => {
    const updatedUser = await controller.update('uuid-1', { name: 'Alice Updated' });
    expect(updatedUser.fullName).toBe('Alice Updated');
    expect(mockUsersService.update).toHaveBeenCalledWith('uuid-1', { name: 'Alice Updated' });
  });

  it('should deactivate a user', async () => {
    const deactivatedUser = await controller.deactivate('uuid-1');
    expect(deactivatedUser.isActive).toBe(false);
    expect(mockUsersService.deactivate).toHaveBeenCalledWith('uuid-1');
  });

  it('should delete a user', async () => {
    const deletedUser = await controller.remove('uuid-1');
    expect(deletedUser).toEqual(mockUsers[0]);
    expect(mockUsersService.delete).toHaveBeenCalledWith('uuid-1');
  });
});
