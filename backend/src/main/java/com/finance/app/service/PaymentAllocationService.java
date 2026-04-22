package com.finance.app.service;

import com.finance.app.domain.PaymentAllocation;
import com.finance.app.repository.PaymentAllocationRepository;
import com.finance.app.service.dto.PaymentAllocationDTO;
import com.finance.app.service.mapper.PaymentAllocationMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.PaymentAllocation}.
 */
@Service
@Transactional
public class PaymentAllocationService {

    private static final Logger LOG = LoggerFactory.getLogger(PaymentAllocationService.class);

    private final PaymentAllocationRepository paymentAllocationRepository;

    private final PaymentAllocationMapper paymentAllocationMapper;

    public PaymentAllocationService(
        PaymentAllocationRepository paymentAllocationRepository,
        PaymentAllocationMapper paymentAllocationMapper
    ) {
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.paymentAllocationMapper = paymentAllocationMapper;
    }

    /**
     * Save a paymentAllocation.
     *
     * @param paymentAllocationDTO the entity to save.
     * @return the persisted entity.
     */
    public PaymentAllocationDTO save(PaymentAllocationDTO paymentAllocationDTO) {
        LOG.debug("Request to save PaymentAllocation : {}", paymentAllocationDTO);
        PaymentAllocation paymentAllocation = paymentAllocationMapper.toEntity(paymentAllocationDTO);
        paymentAllocation = paymentAllocationRepository.save(paymentAllocation);
        return paymentAllocationMapper.toDto(paymentAllocation);
    }

    /**
     * Update a paymentAllocation.
     *
     * @param paymentAllocationDTO the entity to save.
     * @return the persisted entity.
     */
    public PaymentAllocationDTO update(PaymentAllocationDTO paymentAllocationDTO) {
        LOG.debug("Request to update PaymentAllocation : {}", paymentAllocationDTO);
        PaymentAllocation paymentAllocation = paymentAllocationMapper.toEntity(paymentAllocationDTO);
        paymentAllocation = paymentAllocationRepository.save(paymentAllocation);
        return paymentAllocationMapper.toDto(paymentAllocation);
    }

    /**
     * Partially update a paymentAllocation.
     *
     * @param paymentAllocationDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PaymentAllocationDTO> partialUpdate(PaymentAllocationDTO paymentAllocationDTO) {
        LOG.debug("Request to partially update PaymentAllocation : {}", paymentAllocationDTO);

        return paymentAllocationRepository
            .findById(paymentAllocationDTO.getId())
            .map(existingPaymentAllocation -> {
                paymentAllocationMapper.partialUpdate(existingPaymentAllocation, paymentAllocationDTO);

                return existingPaymentAllocation;
            })
            .map(paymentAllocationRepository::save)
            .map(paymentAllocationMapper::toDto);
    }

    /**
     * Get all the paymentAllocations.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<PaymentAllocationDTO> findAll() {
        LOG.debug("Request to get all PaymentAllocations");
        return paymentAllocationRepository
            .findAll()
            .stream()
            .map(paymentAllocationMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one paymentAllocation by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PaymentAllocationDTO> findOne(Long id) {
        LOG.debug("Request to get PaymentAllocation : {}", id);
        return paymentAllocationRepository.findById(id).map(paymentAllocationMapper::toDto);
    }

    /**
     * Delete the paymentAllocation by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete PaymentAllocation : {}", id);
        paymentAllocationRepository.deleteById(id);
    }
}
