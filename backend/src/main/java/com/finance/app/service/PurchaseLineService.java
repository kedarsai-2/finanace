package com.finance.app.service;

import com.finance.app.domain.PurchaseLine;
import com.finance.app.repository.PurchaseLineRepository;
import com.finance.app.service.dto.PurchaseLineDTO;
import com.finance.app.service.mapper.PurchaseLineMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.PurchaseLine}.
 */
@Service
@Transactional
public class PurchaseLineService {

    private static final Logger LOG = LoggerFactory.getLogger(PurchaseLineService.class);

    private final PurchaseLineRepository purchaseLineRepository;

    private final PurchaseLineMapper purchaseLineMapper;

    public PurchaseLineService(PurchaseLineRepository purchaseLineRepository, PurchaseLineMapper purchaseLineMapper) {
        this.purchaseLineRepository = purchaseLineRepository;
        this.purchaseLineMapper = purchaseLineMapper;
    }

    /**
     * Save a purchaseLine.
     *
     * @param purchaseLineDTO the entity to save.
     * @return the persisted entity.
     */
    public PurchaseLineDTO save(PurchaseLineDTO purchaseLineDTO) {
        LOG.debug("Request to save PurchaseLine : {}", purchaseLineDTO);
        PurchaseLine purchaseLine = purchaseLineMapper.toEntity(purchaseLineDTO);
        purchaseLine = purchaseLineRepository.save(purchaseLine);
        return purchaseLineMapper.toDto(purchaseLine);
    }

    /**
     * Update a purchaseLine.
     *
     * @param purchaseLineDTO the entity to save.
     * @return the persisted entity.
     */
    public PurchaseLineDTO update(PurchaseLineDTO purchaseLineDTO) {
        LOG.debug("Request to update PurchaseLine : {}", purchaseLineDTO);
        PurchaseLine purchaseLine = purchaseLineMapper.toEntity(purchaseLineDTO);
        purchaseLine = purchaseLineRepository.save(purchaseLine);
        return purchaseLineMapper.toDto(purchaseLine);
    }

    /**
     * Partially update a purchaseLine.
     *
     * @param purchaseLineDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PurchaseLineDTO> partialUpdate(PurchaseLineDTO purchaseLineDTO) {
        LOG.debug("Request to partially update PurchaseLine : {}", purchaseLineDTO);

        return purchaseLineRepository
            .findById(purchaseLineDTO.getId())
            .map(existingPurchaseLine -> {
                purchaseLineMapper.partialUpdate(existingPurchaseLine, purchaseLineDTO);

                return existingPurchaseLine;
            })
            .map(purchaseLineRepository::save)
            .map(purchaseLineMapper::toDto);
    }

    /**
     * Get all the purchaseLines.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<PurchaseLineDTO> findAll() {
        LOG.debug("Request to get all PurchaseLines");
        return purchaseLineRepository.findAll().stream().map(purchaseLineMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the purchaseLines with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<PurchaseLineDTO> findAllWithEagerRelationships(Pageable pageable) {
        return purchaseLineRepository.findAllWithEagerRelationships(pageable).map(purchaseLineMapper::toDto);
    }

    /**
     * Get one purchaseLine by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseLineDTO> findOne(Long id) {
        LOG.debug("Request to get PurchaseLine : {}", id);
        return purchaseLineRepository.findOneWithEagerRelationships(id).map(purchaseLineMapper::toDto);
    }

    /**
     * Delete the purchaseLine by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete PurchaseLine : {}", id);
        purchaseLineRepository.deleteById(id);
    }
}
