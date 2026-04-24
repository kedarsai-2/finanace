package com.finance.app.service;

import com.finance.app.domain.Purchase;
import com.finance.app.repository.PurchaseLineRepository;
import com.finance.app.repository.PurchaseRepository;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.service.mapper.PurchaseMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.Purchase}.
 */
@Service
@Transactional
public class PurchaseService {

    private static final Logger LOG = LoggerFactory.getLogger(PurchaseService.class);

    private final PurchaseRepository purchaseRepository;

    private final PurchaseLineRepository purchaseLineRepository;

    private final PurchaseMapper purchaseMapper;

    public PurchaseService(
        PurchaseRepository purchaseRepository,
        PurchaseLineRepository purchaseLineRepository,
        PurchaseMapper purchaseMapper
    ) {
        this.purchaseRepository = purchaseRepository;
        this.purchaseLineRepository = purchaseLineRepository;
        this.purchaseMapper = purchaseMapper;
    }

    /**
     * Save a purchase.
     *
     * @param purchaseDTO the entity to save.
     * @return the persisted entity.
     */
    public PurchaseDTO save(PurchaseDTO purchaseDTO) {
        LOG.debug("Request to save Purchase : {}", purchaseDTO);
        Purchase purchase = purchaseMapper.toEntity(purchaseDTO);
        purchase = purchaseRepository.save(purchase);
        return purchaseMapper.toDto(purchase);
    }

    /**
     * Update a purchase.
     *
     * @param purchaseDTO the entity to save.
     * @return the persisted entity.
     */
    public PurchaseDTO update(PurchaseDTO purchaseDTO) {
        LOG.debug("Request to update Purchase : {}", purchaseDTO);
        Purchase purchase = purchaseMapper.toEntity(purchaseDTO);
        purchase = purchaseRepository.save(purchase);
        return purchaseMapper.toDto(purchase);
    }

    /**
     * Partially update a purchase.
     *
     * @param purchaseDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PurchaseDTO> partialUpdate(PurchaseDTO purchaseDTO) {
        LOG.debug("Request to partially update Purchase : {}", purchaseDTO);

        return purchaseRepository
            .findById(purchaseDTO.getId())
            .map(existingPurchase -> {
                purchaseMapper.partialUpdate(existingPurchase, purchaseDTO);

                return existingPurchase;
            })
            .map(purchaseRepository::save)
            .map(purchaseMapper::toDto);
    }

    /**
     * Get all the purchases with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<PurchaseDTO> findAllWithEagerRelationships(Pageable pageable) {
        return purchaseRepository.findAllWithEagerRelationships(pageable).map(purchaseMapper::toDto);
    }

    /**
     * Get one purchase by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseDTO> findOne(Long id) {
        LOG.debug("Request to get Purchase : {}", id);
        return purchaseRepository.findOneWithEagerRelationships(id).map(purchaseMapper::toDto);
    }

    /**
     * Delete the purchase by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Purchase : {}", id);
        purchaseLineRepository.deleteAllByPurchaseId(id);
        purchaseRepository.deleteById(id);
    }
}
