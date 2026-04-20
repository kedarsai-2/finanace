package com.finance.app.service.mapper;

import com.finance.app.domain.Item;
import com.finance.app.domain.Purchase;
import com.finance.app.domain.PurchaseLine;
import com.finance.app.service.dto.ItemDTO;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.service.dto.PurchaseLineDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link PurchaseLine} and its DTO {@link PurchaseLineDTO}.
 */
@Mapper(componentModel = "spring")
public interface PurchaseLineMapper extends EntityMapper<PurchaseLineDTO, PurchaseLine> {
    @Mapping(target = "item", source = "item", qualifiedByName = "itemName")
    @Mapping(target = "purchase", source = "purchase", qualifiedByName = "purchaseNumber")
    PurchaseLineDTO toDto(PurchaseLine s);

    @Named("itemName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    ItemDTO toDtoItemName(Item item);

    @Named("purchaseNumber")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "number", source = "number")
    PurchaseDTO toDtoPurchaseNumber(Purchase purchase);
}
