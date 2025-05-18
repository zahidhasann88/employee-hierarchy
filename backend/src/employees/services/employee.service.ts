import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { SubordinatesResponseDto } from '../dto/subordinates-response.dto';
import { HierarchicalEmployeeDto } from '../dto/hierarchical-employee.dto';
import { LoggerService } from '../../logger/logger.service';
import { CommonResponse } from '../../common/dto/common-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { INTERNAL_SERVER_ERROR } from '../../common/common.message';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private logger: LoggerService,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<CommonResponse<EmployeeResponseDto>> {
    try {
      if (createEmployeeDto.managerId) {
        const managerValidation = await this.validateManager(
          createEmployeeDto.managerId,
        );
        if (!managerValidation.success) {
          return managerValidation as CommonResponse<EmployeeResponseDto>;
        }
      }

      const employee = this.employeeRepository.create(createEmployeeDto);
      const savedEmployee = await this.employeeRepository.save(employee);

      this.logger.log({
        message: 'Employee created successfully',
        employeeId: savedEmployee.id,
        employeeName: savedEmployee.name,
        position: savedEmployee.position,
      });

      return {
        data: new EmployeeResponseDto(savedEmployee),
        message: 'Employee created successfully',
        success: true,
      };
    } catch (error) {
      return this.handleDatabaseError(error, 'Error creating employee');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<CommonResponse<PaginatedResponseDto<EmployeeResponseDto>>> {
    try {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(100, limit));

      const [employees, total] = await this.employeeRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
      });

      const paginatedResponse = new PaginatedResponseDto(
        employees.map((employee) => new EmployeeResponseDto(employee)),
        total,
        page,
        limit,
      );

      return {
        data: paginatedResponse,
        message: 'Employees fetched successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error fetching employees',
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async findOne(id: number): Promise<CommonResponse<EmployeeResponseDto>> {
    try {
      const employee = await this.employeeRepository.findOne({ where: { id } });

      if (!employee) {
        this.logger.warn({
          message: 'Employee not found',
          employeeId: id,
        });

        return {
          message: 'Employee not found',
          success: false,
        };
      }

      return {
        data: new EmployeeResponseDto(employee),
        message: 'Employee fetched successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error fetching employee',
        employeeId: id,
        error: error.message,
        stack: error.stack,
      });

      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<CommonResponse<EmployeeResponseDto>> {
    try {
      const existingEmployee = await this.findOne(id);
      if (!existingEmployee.success) {
        return existingEmployee;
      }

      if (updateEmployeeDto.managerId) {
        const managerValidation = await this.validateManager(
          updateEmployeeDto.managerId,
        );
        if (!managerValidation.success) {
          return managerValidation as CommonResponse<EmployeeResponseDto>;
        }

        if (updateEmployeeDto.managerId === id) {
          return {
            message: 'Subordinate cannot be manager',
            success: false,
          };
        }

        if (updateEmployeeDto.managerId === id) {
          return {
            message: 'Subordinate cannot be manager',
            success: false,
          };
        }

        const isCircular = await this.checkForCircularHierarchy(
          id,
          updateEmployeeDto.managerId,
        );
        if (isCircular) {
          return {
            message:
              'Cannot assign a subordinate as manager (circular hierarchy)',
            success: false,
          };
        }
      }

      await this.employeeRepository.update(id, updateEmployeeDto);
      const updatedEmployee = await this.employeeRepository.findOne({
        where: { id },
      });

      if (!updatedEmployee) {
        return {
          message: 'Employee not found',
          success: false,
        };
      }

      this.logger.log({
        message: 'Employee updated successfully',
        employeeId: id,
        updates: updateEmployeeDto,
      });

      return {
        data: new EmployeeResponseDto(updatedEmployee),
        message: 'Employee updated successfully',
        success: true,
      };
    } catch (error) {
      return this.handleDatabaseError(error, 'Error updating employee');
    }
  }

  async remove(id: number): Promise<CommonResponse<void>> {
    try {
      const employeeResponse = await this.findOne(id);
      if (!employeeResponse.success || !employeeResponse.data) {
        return {
          message: 'Employee not found',
          success: false,
        };
      }

      const subordinates = await this.findDirectSubordinates(id);
      if (subordinates.length > 0) {
        return {
          message:
            'Cannot delete employee with subordinates. Please reassign subordinates first.',
          success: false,
        };
      }

      await this.employeeRepository.delete(id);

      this.logger.log({
        message: 'Employee deleted successfully',
        employeeId: id,
      });

      return {
        message: 'Employee deleted successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error deleting employee',
        employeeId: id,
        error: error.message,
        stack: error.stack,
      });

      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async findAllSubordinates(
    id: number,
  ): Promise<CommonResponse<SubordinatesResponseDto>> {
    try {
      const employee = await this.employeeRepository.findOne({ where: { id } });
      if (!employee) {
        return {
          message: 'Employee not found',
          success: false,
        };
      }

      const hierarchicalEmployee = await this.buildHierarchy(employee);

      const responseMessage =
        !hierarchicalEmployee.subordinates ||
        hierarchicalEmployee.subordinates.length === 0
          ? 'This employee has no subordinates'
          : undefined;

      const result = new SubordinatesResponseDto(
        hierarchicalEmployee,
        responseMessage,
      );

      return {
        data: result,
        message: 'Subordinates fetched successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error fetching subordinates',
        employeeId: id,
        error: error.message,
        stack: error.stack,
      });

      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  private async buildHierarchy(
    employee: Employee,
  ): Promise<HierarchicalEmployeeDto> {
    const directReports = await this.employeeRepository.find({
      where: { managerId: employee.id },
    });

    const subordinates = await Promise.all(
      directReports.map((report) => this.buildHierarchy(report)),
    );

    const totalSubordinatesCount = subordinates.reduce(
      (total, subordinate) =>
        total + 1 + (subordinate.totalSubordinatesCount || 0),
      0,
    );

    const hierarchicalEmployee = new HierarchicalEmployeeDto(
      employee,
      subordinates,
    );
    hierarchicalEmployee.totalSubordinatesCount = totalSubordinatesCount;
    return hierarchicalEmployee;
  }

  private async findDirectSubordinates(managerId: number): Promise<Employee[]> {
    return this.employeeRepository.find({ where: { managerId } });
  }

  private async findSubordinatesRecursively(
    managerId: number,
  ): Promise<Employee[]> {
    try {
      const directReports = await this.employeeRepository.find({
        where: { managerId },
      });

      let allSubordinates = [...directReports];

      for (const employee of directReports) {
        const subordinates = await this.findSubordinatesRecursively(
          employee.id,
        );
        allSubordinates = [...allSubordinates, ...subordinates];
      }

      return allSubordinates;
    } catch (error) {
      this.logger.error({
        message: 'Error finding subordinates recursively',
        managerId,
        error: error.message,
        stack: error.stack,
      });

      throw new BadRequestException(
        'Failed to fetch employee hierarchy. Please try again.',
      );
    }
  }

  private async checkForCircularHierarchy(
    employeeId: number,
    newManagerId: number,
  ): Promise<boolean> {
    if (employeeId === newManagerId) return true;

    const subordinates = await this.findSubordinatesRecursively(employeeId);

    return subordinates.some((sub) => sub.id === newManagerId);
  }

  private async validateManager(
    managerId: number,
  ): Promise<CommonResponse<EmployeeResponseDto>> {
    if (!managerId)
      return {
        success: true,
        message: 'Manager ID is not valid',
        data: undefined,
      };

    const manager = await this.employeeRepository.findOne({
      where: { id: managerId },
    });

    if (!manager) {
      return {
        message: 'Employee not found',
        success: false,
        data: undefined,
      };
    }

    return {
      success: true,
      message: 'Manager found',
      data: new EmployeeResponseDto(manager),
    };
  }

  private handleDatabaseError(
    error: any,
    context: string,
  ): CommonResponse<any> {
    this.logger.error({
      message: context,
      error: error.message,
      stack: error.stack,
    });

    if (error.code === '23505') {
      return {
        message: 'Employee already exists',
        success: false,
      };
    }

    if (error.code === '23503') {
      return {
        message: 'Employee not found',
        success: false,
      };
    }

    return {
      message: INTERNAL_SERVER_ERROR,
      success: false,
    };
  }
}
