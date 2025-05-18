import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from '../services/employee.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { SubordinatesResponseDto } from '../dto/subordinates-response.dto';
import { CommonResponse } from '../../common/dto/common-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../../common/guards/throttle.guard';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let employeeService: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          ttl: 60,
          limit: 10,
        }]),
      ],
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findAllSubordinates: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: CustomThrottlerGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    employeeService = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createDto: CreateEmployeeDto = {
        name: 'John Doe',
        position: 'Software Engineer',
        managerId: undefined,
      };

      const expectedResponse: CommonResponse<EmployeeResponseDto> = {
        data: {
          id: 1,
          name: 'John Doe',
          position: 'Software Engineer',
          managerId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        success: true,
        message: 'Employee created successfully'
      };

      jest.spyOn(employeeService, 'create').mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      const page = 1;
      const limit = 10;
      const expectedResponse: CommonResponse<PaginatedResponseDto<EmployeeResponseDto>> = {
        data: {
          data: [
            {
              id: 1,
              name: 'John Doe',
              position: 'Software Engineer',
              managerId: undefined,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        },
        success: true,
        message: 'Employees retrieved successfully'
      };

      jest.spyOn(employeeService, 'findAll').mockResolvedValue(expectedResponse);

      const result = await controller.findAll(page, limit);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.findAll).toHaveBeenCalledWith(page, limit);
    });
  });

  describe('findOne', () => {
    it('should return an employee by id', async () => {
      const id = 1;
      const expectedResponse: CommonResponse<EmployeeResponseDto> = {
        data: {
          id: 1,
          name: 'John Doe',
          position: 'Software Engineer',
          managerId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        success: true,
        message: 'Employee fetched successfully'
      };

      jest.spyOn(employeeService, 'findOne').mockResolvedValue(expectedResponse);

      const result = await controller.findOne(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.findOne).toHaveBeenCalledWith(id);
    });

    it('should return error if employee is not found', async () => {
      const id = 999;
      const expectedResponse: CommonResponse<EmployeeResponseDto> = {
        success: false,
        message: 'Employee not found'
      };

      jest.spyOn(employeeService, 'findOne').mockResolvedValue(expectedResponse);

      const result = await controller.findOne(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('findAllSubordinates', () => {
    it('should return all subordinates of an employee', async () => {
      const id = 1;
      const expectedResponse: CommonResponse<SubordinatesResponseDto> = {
        data: {
          employee: {
            id: 1,
            name: 'John Doe',
            position: 'CTO',
            managerId: undefined,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            subordinates: [
              {
                id: 2,
                name: 'Jane Smith',
                position: 'Senior Software Eng',
                managerId: 1,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                subordinates: [
                  {
                    id: 3,
                    name: 'Bob Johnson',
                    position: 'Software Eng',
                    managerId: 2,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                    subordinates: [],
                    totalSubordinatesCount: 0
                  }
                ],
                totalSubordinatesCount: 1
              }
            ],
            totalSubordinatesCount: 2
          }
        },
        success: true,
        message: 'Subordinates fetched successfully'
      };

      jest.spyOn(employeeService, 'findAllSubordinates').mockResolvedValue(expectedResponse);

      const result = await controller.findAllSubordinates(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.findAllSubordinates).toHaveBeenCalledWith(id);
    });

    it('should return error if employee is not found', async () => {
      const id = 999;
      const expectedResponse: CommonResponse<SubordinatesResponseDto> = {
        success: false,
        message: 'Employee not found'
      };

      jest.spyOn(employeeService, 'findAllSubordinates').mockResolvedValue(expectedResponse);

      const result = await controller.findAllSubordinates(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.findAllSubordinates).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const id = 1;
      const updateDto: UpdateEmployeeDto = {
        name: 'John Updated',
        position: 'Senior Software Engineer',
      };

      const expectedResponse: CommonResponse<EmployeeResponseDto> = {
        data: {
          id: 1,
          name: 'John Updated',
          position: 'Senior Software Engineer',
          managerId: undefined,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        success: true,
        message: 'Employee updated successfully'
      };

      jest.spyOn(employeeService, 'update').mockResolvedValue(expectedResponse);

      const result = await controller.update(id, updateDto);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should return error if employee is not found', async () => {
      const id = 999;
      const updateDto: UpdateEmployeeDto = {
        name: 'John Updated',
      };

      const expectedResponse: CommonResponse<EmployeeResponseDto> = {
        success: false,
        message: 'Employee not found'
      };

      jest.spyOn(employeeService, 'update').mockResolvedValue(expectedResponse);

      const result = await controller.update(id, updateDto);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove an employee', async () => {
      const id = 1;
      const expectedResponse: CommonResponse<void> = {
        success: true,
        message: 'Employee deleted successfully'
      };

      jest.spyOn(employeeService, 'remove').mockResolvedValue(expectedResponse);

      const result = await controller.remove(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.remove).toHaveBeenCalledWith(id);
    });

    it('should return error if employee is not found', async () => {
      const id = 999;
      const expectedResponse: CommonResponse<void> = {
        success: false,
        message: 'Employee not found'
      };

      jest.spyOn(employeeService, 'remove').mockResolvedValue(expectedResponse);

      const result = await controller.remove(id);
      expect(result).toEqual(expectedResponse);
      expect(employeeService.remove).toHaveBeenCalledWith(id);
    });
  });
}); 