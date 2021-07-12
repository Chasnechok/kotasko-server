import { Post, Controller, Body, Get } from '@nestjs/common'
import { Roles } from 'src/auth/roles.decorator'
import { UserRoleTypes } from 'src/users/user.schema'
import { CreateOrganisationDto, GetHeadDto } from './dtos/organisation.dto'
import { OrganisationsService } from './organisations.service'

@Controller('organisation')
export class OrganisationsController {
    constructor(private OrganisationsService: OrganisationsService) {}

    @Roles(UserRoleTypes.ADMIN)
    @Post('/create')
    createOrgnisation(@Body() CreateOrganisationDto: CreateOrganisationDto) {
        return this.OrganisationsService.create(CreateOrganisationDto)
    }

    @Get('/list')
    getOrganisations() {
        return this.OrganisationsService.findAll()
    }

    @Get('/getHead')
    getHead(@Body() GetHeadDto: GetHeadDto) {
        return this.OrganisationsService.getHead(GetHeadDto)
    }
}
