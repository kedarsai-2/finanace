package com.finance.app.service.mapper;

import com.finance.app.domain.Invoice;
import com.finance.app.domain.InvoiceLine;
import com.finance.app.domain.Item;
import com.finance.app.service.dto.InvoiceDTO;
import com.finance.app.service.dto.InvoiceLineDTO;
import com.finance.app.service.dto.ItemDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link InvoiceLine} and its DTO {@link InvoiceLineDTO}.
 */
@Mapper(componentModel = "spring")
public interface InvoiceLineMapper extends EntityMapper<InvoiceLineDTO, InvoiceLine> {
    @Mapping(target = "item", source = "item", qualifiedByName = "itemName")
    @Mapping(target = "invoice", source = "invoice", qualifiedByName = "invoiceNumber")
    InvoiceLineDTO toDto(InvoiceLine s);

    @Named("itemName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    ItemDTO toDtoItemName(Item item);

    @Named("invoiceNumber")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "number", source = "number")
    InvoiceDTO toDtoInvoiceNumber(Invoice invoice);
}
