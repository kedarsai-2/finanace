package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.domain.Invoice;
import com.finance.app.domain.Party;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.InvoiceDTO;
import com.finance.app.service.dto.PartyDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Invoice} and its DTO {@link InvoiceDTO}.
 */
@Mapper(componentModel = "spring")
public interface InvoiceMapper extends EntityMapper<InvoiceDTO, Invoice> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    @Mapping(target = "party", source = "party", qualifiedByName = "partyName")
    InvoiceDTO toDto(Invoice s);

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
