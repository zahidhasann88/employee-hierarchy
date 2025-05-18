import { ApiProperty } from '@nestjs/swagger';
export class CommonResponse<E> {
    @ApiProperty()
    data?: E;

    @ApiProperty()
    message: string;

    @ApiProperty()
    success: boolean;
}
