package com.finance.app.service.mapper;

import com.finance.app.domain.Payment;
import com.finance.app.domain.PaymentAllocation;
import com.finance.app.service.dto.PaymentAllocationDTO;
import com.finance.app.service.dto.PaymentDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link PaymentAllocation} and its DTO {@link PaymentAllocationDTO}.
 */
@Mapper(componentModel = "spring")
public interface PaymentAllocationMapper extends EntityMapper<PaymentAllocationDTO, PaymentAllocation> {
    @Mapping(target = "payment", source = "payment", qualifiedByName = "paymentId")
    PaymentAllocationDTO toDto(PaymentAllocation s);

    @Named("paymentId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PaymentDTO toDtoPaymentId(Payment payment);
}
