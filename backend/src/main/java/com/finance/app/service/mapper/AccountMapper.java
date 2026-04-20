package com.finance.app.service.mapper;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.dto.BusinessDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Account} and its DTO {@link AccountDTO}.
 */
@Mapper(componentModel = "spring")
public interface AccountMapper extends EntityMapper<AccountDTO, Account> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    AccountDTO toDto(Account s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);
}
