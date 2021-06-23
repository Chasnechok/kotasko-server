import { Post, Controller, Body, Get } from '@nestjs/common';
import { ValidationPipe } from 'src/validation.pipe';
import { CreateOrganisationDto, GetHeadDto } from './dtos/organisation.dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisation')
export class OrganisationsController {
    constructor(private OrganisationsService: OrganisationsService) {}

    @Post('/create') 
    createOrgnisation(@Body(new ValidationPipe()) CreateOrganisationDto: CreateOrganisationDto) {
        return this.OrganisationsService.create(CreateOrganisationDto)
    }
    

    @Get('/list')
    getOrganisations() {
        return this.OrganisationsService.findAll()
    }

    @Get('/getHead')
    getHead(@Body(new ValidationPipe()) GetHeadDto: GetHeadDto) {
        return this.OrganisationsService.getHead(GetHeadDto)
    }
}
