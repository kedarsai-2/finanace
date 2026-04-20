package com.finance.app.service.mapper;

import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.Transfer;
import com.finance.app.service.dto.AccountDTO;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.TransferDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Transfer} and its DTO {@link TransferDTO}.
 */
@Mapper(componentModel = "spring")
public interface TransferMapper extends EntityMapper<TransferDTO, Transfer> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    @Mapping(target = "fromAccount", source = "fromAccount", qualifiedByName = "accountName")
    @Mapping(target = "toAccount", source = "toAccount", qualifiedByName = "accountName")
    TransferDTO toDto(Transfer s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);

    @Named("accountName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    AccountDTO toDtoAccountName(Account account);
}
