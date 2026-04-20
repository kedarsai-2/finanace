package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.domain.Party;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.PartyDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Party} and its DTO {@link PartyDTO}.
 */
@Mapper(componentModel = "spring")
public interface PartyMapper extends EntityMapper<PartyDTO, Party> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    PartyDTO toDto(Party s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);
}
