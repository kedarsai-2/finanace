package com.finance.app.service.mapper;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.Party;
import com.finance.app.domain.Payment;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.PartyDTO;
import com.finance.app.service.dto.PaymentDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Payment} and its DTO {@link PaymentDTO}.
 */
@Mapper(componentModel = "spring")
public interface PaymentMapper extends EntityMapper<PaymentDTO, Payment> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    @Mapping(target = "party", source = "party", qualifiedByName = "partyName")
    @Mapping(target = "account", source = "account", qualifiedByName = "accountName")
    PaymentDTO toDto(Payment s);

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

    @Named("accountName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    AccountDTO toDtoAccountName(Account account);
}
