package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.domain.Party;
import com.finance.app.domain.Purchase;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.PartyDTO;
import com.finance.app.service.dto.PurchaseDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Purchase} and its DTO {@link PurchaseDTO}.
 */
@Mapper(componentModel = "spring")
public interface PurchaseMapper extends EntityMapper<PurchaseDTO, Purchase> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    @Mapping(target = "party", source = "party", qualifiedByName = "partyName")
    PurchaseDTO toDto(Purchase s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);

    @Named("partyName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    PartyDTO toDtoPartyName(Party party);
}
