package com.finance.app.service;

import com.finance.app.domain.Business;
import com.finance.app.repository.BusinessRepository;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.mapper.BusinessMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.Business}.
 */
@Service
@Transactional
public class BusinessService {

    private static final Logger LOG = LoggerFactory.getLogger(BusinessService.class);

    private final BusinessRepository businessRepository;

    private final BusinessMapper businessMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public BusinessService(BusinessRepository businessRepository, BusinessMapper businessMapper) {
        this.businessRepository = businessRepository;
        this.businessMapper = businessMapper;
    }

    /**
     * Save a business.
     *
     * @param businessDTO the entity to save.
     * @return the persisted entity.
     */
    public BusinessDTO save(BusinessDTO businessDTO) {
        LOG.debug("Request to save Business : {}", businessDTO);
        Business business = businessMapper.toEntity(businessDTO);
        business = businessRepository.save(business);
        return businessMapper.toDto(business);
    }

    /**
     * Update a business.
     *
     * @param businessDTO the entity to save.
     * @return the persisted entity.
     */
    public BusinessDTO update(BusinessDTO businessDTO) {
        LOG.debug("Request to update Business : {}", businessDTO);
        Business business = businessMapper.toEntity(businessDTO);
        business = businessRepository.save(business);
        return businessMapper.toDto(business);
    }

    /**
     * Partially update a business.
     *
     * @param businessDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<BusinessDTO> partialUpdate(BusinessDTO businessDTO) {
        LOG.debug("Request to partially update Business : {}", businessDTO);

        return businessRepository
            .findById(businessDTO.getId())
            .map(existingBusiness -> {
                businessMapper.partialUpdate(existingBusiness, businessDTO);

                return existingBusiness;
            })
            .map(businessRepository::save)
            .map(businessMapper::toDto);
    }

    /**
     * Get all the businesses.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<BusinessDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Businesses");
        return businessRepository.findAll(pageable).map(businessMapper::toDto);
    }

    /**
     * Get one business by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<BusinessDTO> findOne(Long id) {
        LOG.debug("Request to get Business : {}", id);
        return businessRepository.findById(id).map(businessMapper::toDto);
    }

    /**
     * Delete the business by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Business : {}", id);
        deleteBusinessChildren(id);
        businessRepository.deleteById(id);
    }

    /**
     * Business deletion is user-facing and should remove the full company workspace.
     * Child rows are removed explicitly to satisfy FK constraints in a predictable order.
     */
    private void deleteBusinessChildren(Long businessId) {
        executeDelete("delete from payment_allocation where payment_id in (select id from payment where business_id = :businessId)", businessId);
        executeDelete("delete from invoice_line where invoice_id in (select id from invoice where business_id = :businessId)", businessId);
        executeDelete("delete from invoice_line where item_id in (select id from item where business_id = :businessId)", businessId);
        executeDelete("delete from purchase_line where purchase_id in (select id from purchase where business_id = :businessId)", businessId);
        executeDelete("delete from purchase_line where item_id in (select id from item where business_id = :businessId)", businessId);
        executeDelete("delete from expense where business_id = :businessId", businessId);
        executeDelete("delete from transfer where business_id = :businessId", businessId);
        executeDelete("delete from transfer where from_account_id in (select id from account where business_id = :businessId)", businessId);
        executeDelete("delete from transfer where to_account_id in (select id from account where business_id = :businessId)", businessId);
        executeDelete("delete from payment where business_id = :businessId", businessId);
        executeDelete("delete from invoice where business_id = :businessId", businessId);
        executeDelete("delete from purchase where business_id = :businessId", businessId);
        executeDelete("delete from item where business_id = :businessId", businessId);
        executeDelete("delete from expense_category where business_id = :businessId", businessId);
        executeDelete("delete from account where business_id = :businessId", businessId);
        executeDelete("delete from party where business_id = :businessId", businessId);
    }

    private int executeDelete(String sql, Long businessId) {
        return entityManager.createNativeQuery(sql).setParameter("businessId", businessId).executeUpdate();
    }
}
