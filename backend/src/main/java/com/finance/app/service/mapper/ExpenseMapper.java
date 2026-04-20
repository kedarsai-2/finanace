package com.finance.app.service.mapper;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.Expense;
import com.finance.app.domain.Party;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.ExpenseDTO;
import com.finance.app.service.dto.PartyDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Expense} and its DTO {@link ExpenseDTO}.
 */
@Mapper(componentModel = "spring")
public interface ExpenseMapper extends EntityMapper<ExpenseDTO, Expense> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    @Mapping(target = "party", source = "party", qualifiedByName = "partyName")
    @Mapping(target = "account", source = "account", qualifiedByName = "accountName")
    ExpenseDTO toDto(Expense s);

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
