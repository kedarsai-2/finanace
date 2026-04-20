package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.domain.ExpenseCategory;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.ExpenseCategoryDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link ExpenseCategory} and its DTO {@link ExpenseCategoryDTO}.
 */
@Mapper(componentModel = "spring")
public interface ExpenseCategoryMapper extends EntityMapper<ExpenseCategoryDTO, ExpenseCategory> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    ExpenseCategoryDTO toDto(ExpenseCategory s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);
}
