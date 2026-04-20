package com.finance.app.service.mapper;

import com.finance.app.domain.Business;
import com.finance.app.service.dto.BusinessDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Business} and its DTO {@link BusinessDTO}.
 */
@Mapper(componentModel = "spring")
public interface BusinessMapper extends EntityMapper<BusinessDTO, Business> {}
