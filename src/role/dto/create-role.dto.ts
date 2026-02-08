import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty()
    name: string;

    @IsArray()
    permissions: Array<string>;
}
