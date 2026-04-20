package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.domain.Item;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.dto.ItemDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Item} and its DTO {@link ItemDTO}.
 */
@Mapper(componentModel = "spring")
public interface ItemMapper extends EntityMapper<ItemDTO, Item> {
    @Mapping(target = "business", source = "business", qualifiedByName = "businessName")
    ItemDTO toDto(Item s);

    @Named("businessName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    BusinessDTO toDtoBusinessName(Business business);
}
