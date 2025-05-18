import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { EmployeeService } from './employee.service';
import { Employee } from '../entities/employee.entity';
import { LoggerService } from '../../logger/logger.service';
import { SubordinatesResponseDto } from '../dto/subordinates-response.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CommonResponse } from '../../common/dto/common-response.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';

type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repository: MockRepository<Employee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: getRepositoryToken(Employee),
          useValue: createMockRepository<Employee>(),
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    repository = module.get<MockRepository<Employee>>(getRepositoryToken(Employee));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an employee if found', async () => {
      const employeeId = 1;
      const expectedEmployee = {
        id: employeeId,
        name: 'John Doe',
        position: 'CTO',
        managerId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (repository.findOne as jest.Mock).mockResolvedValue(expectedEmployee);
      
      const result = await service.findOne(employeeId);
      expect(result).toEqual({
        data: new EmployeeResponseDto(expectedEmployee),
        success: true,
        message: 'Employee fetched successfully'
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: employeeId } });
    });

    it('should return error if employee is not found', async () => {
      const employeeId = 1;
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      
      const result = await service.findOne(employeeId);
      expect(result).toEqual({
        success: false,
        message: 'Employee not found'
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: employeeId } });
    });
  });

  describe('findAllSubordinates', () => {
    it('should return all subordinates of an employee', async () => {
      const managerId = 1;
      const employee = {
        id: managerId,
        name: 'John Doe',
        position: 'CTO',
        managerId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const directSubordinates = [
        {
          id: 2,
          name: 'Jane Smith',
          position: 'Senior Software Eng',
          managerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const indirectSubordinates = [
        {
          id: 3,
          name: 'Bob Johnson',
          position: 'Software Eng',
          managerId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // Mock the employee exists
      (repository.findOne as jest.Mock).mockResolvedValueOnce(employee);
      
      // Mock subordinates
      (repository.find as jest.Mock)
        .mockResolvedValueOnce(directSubordinates)
        .mockResolvedValueOnce(indirectSubordinates)
        .mockResolvedValueOnce([]);
      
      const result = await service.findAllSubordinates(managerId);
      
      const expectedResponse: CommonResponse<SubordinatesResponseDto> = {
        data: {
          employee: {
            id: managerId,
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
                managerId,
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
      
      expect(result).toEqual(expectedResponse);
      expect(result.data!.employee.subordinates?.length).toBe(1);
      expect(result.data!.employee.subordinates?.[0].id).toBe(2);
      expect(result.data!.employee.subordinates?.[0].subordinates?.[0].id).toBe(3);
    });

    it('should return error if employee is not found', async () => {
      const managerId = 999;
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      
      const result = await service.findAllSubordinates(managerId);
      expect(result).toEqual({
        success: false,
        message: 'Employee not found'
      });
    });
  });
});