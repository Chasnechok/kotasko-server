import { Post, Controller, Body, Get } from '@nestjs/common'
import { Roles } from 'src/auth/roles.decorator'
import { UserRoleTypes } from 'src/users/user.schema'
import { CreateOrganisationDto, GetHeadDto } from './dtos/organisation.dto'
import { OrganisationsService } from './organisations.service'

@Controller('organisation')
export class OrganisationsController {
    constructor(private organisationsService: OrganisationsService) {}

    @Roles(UserRoleTypes.ADMIN)
    @Post('/create')
    createOrganisation(@Body() dtoIn: CreateOrganisationDto) {
        return this.organisationsService.create(dtoIn)
    }

    @Get('/list')
    getOrganisations() {
        return this.organisationsService.findAll()
    }

    /**
     * TODO
     * Update, Remove
     */

    @Get('/getHead')
    getHead(@Body() dtoIn: GetHeadDto) {
        return this.organisationsService.getHead(dtoIn)
    }
}
